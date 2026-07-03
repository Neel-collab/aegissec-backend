import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Mail, Lock, Eye, EyeOff, Camera, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Matrix rain effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const cols = Math.floor(canvas.width / 16)
    const drops: number[] = Array(cols).fill(1)
    const chars = '01アイウエオABCDEFGHIJKL∑∆Ωαβγ'
    const interval = setInterval(() => {
      ctx.fillStyle = 'rgba(10,15,30,0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#1d4ed8'
      ctx.font = '14px monospace'
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillStyle = i % 3 === 0 ? '#3b82f6' : '#1e3a8a'
        ctx.fillText(char, i * 16, y * 16)
        if (y * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      })
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(email, password)
      if (result.requires_mfa) {
        navigate('/mfa', { state: { user_id: result.user_id, email } })
      } else {
        navigate('/')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: '#0a0f1e' }}>
      {/* Left — Matrix Panel */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-40" />
        <div className="relative z-10 text-center px-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 rounded-2xl" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                <Shield size={52} color="#3b82f6" />
              </div>
            </div>
            <h1 className="text-5xl font-black mb-4" style={{ color: '#f1f5f9', letterSpacing: '-1px' }}>AegisSec</h1>
            <p className="text-xl font-light mb-2" style={{ color: '#3b82f6' }}>AI-Powered Cyber Threat Detection</p>
            <p className="text-sm" style={{ color: '#475569' }}>Enterprise Security Operations Center</p>
            <div className="mt-12 grid grid-cols-3 gap-4">
              {[['20+', 'Threat Types'], ['Real-time', 'Monitoring'], ['AI-Driven', 'Detection']].map(([val, lbl]) => (
                <div key={lbl} className="p-4 rounded-xl text-center" style={{ background: 'rgba(30,58,138,0.3)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <p className="text-xl font-bold" style={{ color: '#60a5fa' }}>{val}</p>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>{lbl}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex flex-1 items-center justify-center px-8" style={{ background: 'rgba(13,27,42,0.95)', borderLeft: '1px solid rgba(30,58,138,0.4)' }}>
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center mb-8">
            <Shield size={32} color="#3b82f6" className="mr-3" />
            <span className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>AegisSec</span>
          </div>

          <h2 className="text-3xl font-bold mb-2" style={{ color: '#f1f5f9' }}>Welcome back</h2>
          <p className="text-sm mb-8" style={{ color: '#64748b' }}>Sign in to your security dashboard</p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 rounded-xl mb-6" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle size={16} color="#ef4444" />
              <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Email Address</label>
              <div className="relative">
                <Mail size={16} color="#475569" className="absolute left-4 top-1/2 -translate-y-1/2" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: 'rgba(15,30,53,0.8)', border: '1px solid rgba(30,58,138,0.5)', color: '#f1f5f9' }}
                  placeholder="you@company.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Password</label>
              <div className="relative">
                <Lock size={16} color="#475569" className="absolute left-4 top-1/2 -translate-y-1/2" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full pl-11 pr-12 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(15,30,53,0.8)', border: '1px solid rgba(30,58,138,0.5)', color: '#f1f5f9' }}
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2">
                  {showPass ? <EyeOff size={16} color="#475569" /> : <Eye size={16} color="#475569" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm" style={{ color: '#3b82f6' }}>Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2"
              style={{ background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg,#1d4ed8,#3b82f6)', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</> : <><Shield size={16} /> Sign In</>}
            </button>

            <div className="relative flex items-center my-2">
              <div className="flex-1 h-px" style={{ background: 'rgba(30,58,138,0.4)' }} />
              <span className="px-3 text-xs" style={{ color: '#475569' }}>or</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(30,58,138,0.4)' }} />
            </div>

            <Link to="/face-login"
              className="w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background: 'rgba(30,58,138,0.2)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
              <Camera size={16} /> Login with Face ID
            </Link>
          </form>

          <p className="text-center mt-8 text-sm" style={{ color: '#64748b' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#3b82f6' }} className="font-medium">Create account</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
