import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Mail, Lock, User, Building, AlertCircle, CheckCircle } from 'lucide-react'
import { authAPI } from '@/lib/api'

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '', department: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const strength = (p: string) => {
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  }
  const pw = form.password
  const s = strength(pw)
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e']
  const labels = ['Weak', 'Fair', 'Good', 'Strong']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (s < 2) { setError('Password is too weak'); return }
    setError(''); setLoading(true)
    try {
      await authAPI.register({ email: form.email, full_name: form.full_name, password: form.password, department: form.department })
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const fields = [
    { key: 'full_name', label: 'Full Name', icon: User, type: 'text', ph: 'John Doe' },
    { key: 'email', label: 'Email Address', icon: Mail, type: 'email', ph: 'you@company.com' },
    { key: 'department', label: 'Department', icon: Building, type: 'text', ph: 'Security Operations' },
    { key: 'password', label: 'Password', icon: Lock, type: 'password', ph: '••••••••' },
    { key: 'confirm', label: 'Confirm Password', icon: Lock, type: 'password', ph: '••••••••' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#0a0f1e' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Shield size={36} color="#3b82f6" className="mr-3" />
          <span className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>AegisSec</span>
        </div>

        <div className="p-8 rounded-2xl" style={{ background: 'rgba(13,27,42,0.95)', border: '1px solid rgba(30,58,138,0.4)' }}>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#f1f5f9' }}>Create your account</h2>
          <p className="text-sm mb-6" style={{ color: '#64748b' }}>Join the AegisSec security platform</p>

          {error && (
            <div className="flex items-center gap-3 p-3 rounded-xl mb-5" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle size={15} color="#ef4444" />
              <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ key, label, icon: Icon, type, ph }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>{label}</label>
                <div className="relative">
                  <Icon size={15} color="#475569" className="absolute left-4 top-1/2 -translate-y-1/2" />
                  <input type={type} value={form[key as keyof typeof form]} onChange={set(key)} required={key !== 'department'}
                    placeholder={ph} className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(15,30,53,0.8)', border: '1px solid rgba(30,58,138,0.5)', color: '#f1f5f9' }} />
                </div>
                {key === 'password' && pw && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[0,1,2,3].map(i => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ background: i < s ? colors[s-1] : 'rgba(30,58,138,0.3)' }} />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: s > 0 ? colors[s-1] : '#64748b' }}>{pw ? labels[s-1] || '' : ''}</p>
                  </div>
                )}
              </div>
            ))}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white mt-2 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</> : <><CheckCircle size={16} /> Create Account</>}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: '#64748b' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#3b82f6' }} className="font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
