import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Mail, Lock, Key, AlertCircle, CheckCircle2 } from 'lucide-react'
import { authAPI } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authAPI.forgotPassword(email)
      setMessage(res.data.message)
      setUserId(res.data.user_id)
      setStep(2)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setLoading(true)
    try {
      await authAPI.resetPassword(userId, otp, newPassword)
      setMessage('Password reset successful. Redirecting to login...')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0f1e' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Shield size={36} color="#3b82f6" className="mr-3" />
          <span className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>AegisSec</span>
        </div>

        <div className="p-8 rounded-2xl animate-pulse" style={{ background: 'rgba(13,27,42,0.95)', border: '1px solid rgba(30,58,138,0.4)', animationDuration: '3s' }}>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#f1f5f9' }}>Reset Password</h2>
          <p className="text-sm mb-6" style={{ color: '#64748b' }}>
            {step === 1 ? 'Enter your email to receive an OTP' : 'Enter the code sent to your email and set a new password'}
          </p>

          {error && (
            <div className="flex items-center gap-3 p-3 rounded-xl mb-5" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle size={15} color="#ef4444" />
              <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
            </div>
          )}

          {message && (
            <div className="flex items-center gap-3 p-3 rounded-xl mb-5" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <CheckCircle2 size={15} color="#22c55e" />
              <p className="text-sm" style={{ color: '#22c55e' }}>{message}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>Email Address</label>
                <div className="relative">
                  <Mail size={15} color="#475569" className="absolute left-4 top-1/2 -translate-y-1/2" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="you@company.com" className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(15,30,53,0.8)', border: '1px solid rgba(30,58,138,0.5)', color: '#f1f5f9' }} />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white mt-2 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Sending Code...' : 'Send Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>Verification Code (OTP)</label>
                <div className="relative">
                  <Key size={15} color="#475569" className="absolute left-4 top-1/2 -translate-y-1/2" />
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required
                    placeholder="123456" className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(15,30,53,0.8)', border: '1px solid rgba(30,58,138,0.5)', color: '#f1f5f9' }} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>New Password</label>
                <div className="relative">
                  <Lock size={15} color="#475569" className="absolute left-4 top-1/2 -translate-y-1/2" />
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                    placeholder="••••••••" className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(15,30,53,0.8)', border: '1px solid rgba(30,58,138,0.5)', color: '#f1f5f9' }} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>Confirm New Password</label>
                <div className="relative">
                  <Lock size={15} color="#475569" className="absolute left-4 top-1/2 -translate-y-1/2" />
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                    placeholder="••••••••" className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(15,30,53,0.8)', border: '1px solid rgba(30,58,138,0.5)', color: '#f1f5f9' }} />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white mt-2 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          )}

          <p className="text-center mt-6 text-sm" style={{ color: '#64748b' }}>
            Back to{' '}
            <Link to="/login" style={{ color: '#3b82f6' }} className="font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
