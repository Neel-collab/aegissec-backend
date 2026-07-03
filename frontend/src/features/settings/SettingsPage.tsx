import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Settings, User, Shield, Camera, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import { authAPI } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { user, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')

  // Profile Form States
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [department, setDepartment] = useState(user?.department || '')
  const [phone, setPhone] = useState(user?.phone || '')

  // Password Reset Form States
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Face Registration Camera States
  const [faceStatus, setFaceStatus] = useState<'idle' | 'capturing' | 'saving' | 'success' | 'failed'>('idle')
  const [faceError, setFaceError] = useState('')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [notifError, setNotifError] = useState('')
  const [notifSuccess, setNotifSuccess] = useState('')

  const profileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await authAPI.updateMe(data)
      return res.data
    },
    onSuccess: () => {
      refreshUser()
      setNotifSuccess('Profile updated successfully.')
      setTimeout(() => setNotifSuccess(''), 3000)
    },
    onError: (err: any) => {
      setNotifError(err.response?.data?.detail || 'Failed to update profile.')
      setTimeout(() => setNotifError(''), 3000)
    }
  })

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) throw new Error('Passwords do not match')
      await authAPI.changePassword(currentPassword, newPassword)
    },
    onSuccess: () => {
      setNotifSuccess('Password changed successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setNotifSuccess(''), 3000)
    },
    onError: (err: any) => {
      setNotifError(err.message || err.response?.data?.detail || 'Failed to change password.')
      setTimeout(() => setNotifError(''), 3000)
    }
  })

  const mfaMutation = useMutation({
    mutationFn: async () => {
      const res = await authAPI.toggleMFA()
      return res.data
    },
    onSuccess: () => {
      refreshUser()
      queryClient.invalidateQueries({ queryKey: ['me'] })
    }
  })

  const startCamera = async () => {
    setFaceStatus('capturing')
    setFaceError('')
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 360, facingMode: 'user' }
      })
      setStream(mediaStream)
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = mediaStream
      }, 100)
    } catch {
      setFaceError('Could not start camera. Check permissions.')
      setFaceStatus('idle')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const enrollFace = async () => {
    if (!videoRef.current || !stream || !user) return
    setFaceStatus('saving')
    setFaceError('')

    try {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      const base64 = canvas.toDataURL('image/jpeg')

      await authAPI.enrollFace(user.id, base64)
      setFaceStatus('success')
      setNotifSuccess('Face ID enrolled successfully!')
      stopCamera()
      refreshUser()
      setTimeout(() => setNotifSuccess(''), 3000)
    } catch (err: any) {
      setFaceStatus('failed')
      setFaceError(err.response?.data?.detail || 'Face enrollment failed. Ensure clear lighting.')
    }
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    profileMutation.mutate({ full_name: fullName, department, phone })
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    passwordMutation.mutate()
  }

  return (
    <div className="p-8 space-y-6">
      {/* Notifications */}
      {notifSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/20 bg-green-500/10 text-green-500 text-sm">
          <CheckCircle size={16} />
          <span>{notifSuccess}</span>
        </div>
      )}
      {notifError && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-sm">
          <AlertCircle size={16} />
          <span>{notifError}</span>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex border-b border-border gap-6">
        <button onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-semibold tracking-wider uppercase transition-colors relative ${activeTab === 'profile' ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}>
          User Profile
          {activeTab === 'profile' && <motion.div layoutId="activeSetTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button onClick={() => setActiveTab('security')}
          className={`pb-3 text-sm font-semibold tracking-wider uppercase transition-colors relative ${activeTab === 'security' ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}>
          Security Settings
          {activeTab === 'security' && <motion.div layoutId="activeSetTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleProfileSubmit} className="lg:col-span-2 p-6 rounded-xl border border-border bg-card/40 backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="text-primary w-5 h-5" />
              <h3 className="font-bold text-white">Profile Details</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-background border border-border text-white outline-none" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Email Address (Readonly)</label>
                <input type="email" value={user?.email || ''} readOnly disabled
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-background border border-border text-muted-foreground outline-none cursor-not-allowed" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Department</label>
                <input type="text" value={department} onChange={e => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-background border border-border text-white outline-none" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Contact Phone</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-background border border-border text-white outline-none font-mono" />
              </div>
            </div>

            <button type="submit" disabled={profileMutation.isPending}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/95 transition-all">
              {profileMutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Change Password */}
          <form onSubmit={handlePasswordSubmit} className="p-6 rounded-xl border border-border bg-card/40 backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="text-primary w-5 h-5" />
              <h3 className="font-bold text-white">Change Credentials</h3>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Current Password</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required
                placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl text-sm bg-background border border-border text-white outline-none" />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl text-sm bg-background border border-border text-white outline-none" />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl text-sm bg-background border border-border text-white outline-none" />
            </div>

            <button type="submit" disabled={passwordMutation.isPending}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/95 transition-all">
              {passwordMutation.isPending ? 'Updating...' : 'Change Password'}
            </button>
          </form>

          {/* MFA & Face ID */}
          <div className="space-y-6">
            {/* MFA Toggle */}
            <div className="p-6 rounded-xl border border-border bg-card/40 backdrop-blur-sm flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-bold text-white">Email Multi-Factor (MFA)</h3>
                <p className="text-xs text-muted-foreground">Force 6-digit OTP verification codes via your Gmail settings on every sign-in attempt.</p>
              </div>
              <button onClick={() => mfaMutation.mutate()}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  user?.mfa_enabled ? 'bg-destructive/15 border-destructive text-destructive' : 'bg-primary/15 border-primary text-primary'
                }`}>
                {user?.mfa_enabled ? 'Disable' : 'Enable'}
              </button>
            </div>

            {/* Face ID Registration */}
            <div className="p-6 rounded-xl border border-border bg-card/40 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-bold text-white">Face ID Enrollment</h3>
                  <p className="text-xs text-muted-foreground">Register visual face embeddings to bypass typing passwords on login screens.</p>
                </div>
                <span className={`text-[10px] uppercase tracking-widest font-black ${user?.has_face_id ? 'text-green-500' : 'text-yellow-500'}`}>
                  {user?.has_face_id ? 'Enrolled' : 'Not Active'}
                </span>
              </div>

              {faceError && (
                <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-xs">
                  {faceError}
                </div>
              )}

              {faceStatus === 'capturing' && stream && (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden aspect-video border border-border bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                    <div className="absolute inset-4 border border-primary/40 rounded-lg pointer-events-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={enrollFace} className="flex-1 py-2 text-xs font-semibold text-white bg-primary rounded-lg">
                      Capture Face
                    </button>
                    <button onClick={() => { stopCamera(); setFaceStatus('idle'); }} className="flex-1 py-2 text-xs font-semibold text-white bg-secondary rounded-lg">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {faceStatus !== 'capturing' && (
                <button onClick={startCamera}
                  className="w-full py-2.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-xs font-semibold text-white flex items-center justify-center gap-2">
                  <Camera size={14} />
                  <span>{user?.has_face_id ? 'Re-enroll Face Biometrics' : 'Enroll Face ID now'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
