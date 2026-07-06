import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Mail, RefreshCw } from 'lucide-react'
import { authAPI } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

export default function MFAPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const navigate = useNavigate()
  const location = useLocation()
  const { setToken, refreshUser } = useAuth()
  const { user_id, email } = (location.state || {}) as { user_id: string; email: string }

  useEffect(() => {
    if (!user_id) navigate('/login')
    refs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) refs.current[i + 1]?.focus()
    if (next.every(d => d !== '')) handleVerify(next.join(''))
  }

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const handleVerify = async (code?: string) => {
    const pin = code || otp.join('')
    if (pin.length < 6) return
    setError(''); setLoading(true)
    try {
      const res = await authAPI.verifyMFA(user_id, pin)
      setToken(res.access_token) // res is already response.data
      await refreshUser()
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid code')
      setOtp(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0f1e' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <div className="p-10 rounded-2xl text-center" style={{ background: 'rgba(13,27,42,0.95)', border: '1px solid rgba(30,58,138,0.4)' }}>
          <div className="flex items-center justify-center mb-6">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }}
              className="p-5 rounded-2xl" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
              <Mail size={36} color="#3b82f6" />
            </motion.div>
          </div>

          <h2 className="text-2xl font-bold mb-2" style={{ color: '#f1f5f9' }}>Check your email</h2>
          <p className="text-sm mb-1" style={{ color: '#64748b' }}>We sent a 6-digit code to</p>
          <p className="text-sm font-semibold mb-8" style={{ color: '#3b82f6' }}>{email}</p>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm mb-4 p-3 rounded-xl"
              style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              {error}
            </motion.p>
          )}

          <div className="flex gap-3 justify-center mb-8">
            {otp.map((d, i) => (
              <input key={i} ref={el => { refs.current[i] = el }}
                type="text" inputMode="numeric" maxLength={1} value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKey(i, e)}
                className="w-12 h-14 rounded-xl text-center text-xl font-bold outline-none transition-all"
                style={{ background: 'rgba(15,30,53,0.9)', border: d ? '2px solid #3b82f6' : '1px solid rgba(30,58,138,0.5)', color: '#f1f5f9' }} />
            ))}
          </div>

          <button onClick={() => handleVerify()} disabled={loading || otp.some(d => !d)}
            className="w-full py-3 rounded-xl font-semibold text-white mb-4 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', opacity: loading ? 0.7 : 1 }}>
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying...</> : <><Shield size={16} />Verify Code</>}
          </button>

          <button disabled={countdown > 0} onClick={() => setCountdown(60)}
            className="flex items-center justify-center gap-2 w-full text-sm py-2"
            style={{ color: countdown > 0 ? '#475569' : '#3b82f6', cursor: countdown > 0 ? 'not-allowed' : 'pointer' }}>
            <RefreshCw size={14} /> {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
