import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Camera, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { authAPI } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

export default function FaceLoginPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const navigate = useNavigate()
  const { setToken, refreshUser } = useAuth()

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      setError('')
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 360, facingMode: 'user' }
      })
      setStream(mediaStream)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      }, 100)
    } catch (err) {
      setError('Could not access camera. Please ensure permissions are granted.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
  }

  const captureAndVerify = async () => {
    if (!email) {
      setError('Please enter your email first')
      return
    }
    if (!videoRef.current || !stream) {
      setError('Camera not ready')
      return
    }

    setError('')
    setStatus('scanning')

    try {
      // Capture frame
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      }
      const base64Image = canvas.toDataURL('image/jpeg')

      const res = await authAPI.faceLogin(email, base64Image)
      setStatus('success')
      setToken(res.access_token)
      await refreshUser()
      stopCamera()
      setTimeout(() => {
        navigate('/')
      }, 1000)
    } catch (err: any) {
      setStatus('failed')
      setError(err.response?.data?.detail || 'Face recognition failed. Ensure you are enrolled.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0f1e' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <div className="p-8 rounded-2xl" style={{ background: 'rgba(13,27,42,0.95)', border: '1px solid rgba(30,58,138,0.4)' }}>
          <div className="flex items-center justify-between mb-6">
            <Link to="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>
            <div className="flex items-center">
              <Shield size={24} color="#3b82f6" className="mr-2" />
              <span className="font-bold text-white">AegisFace</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Face Recognition Login</h2>
          <p className="text-sm text-muted-foreground mb-6">Enter email and position your face in the camera frame.</p>

          {error && (
            <div className="flex items-center gap-3 p-3 rounded-xl mb-5" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle size={15} color="#ef4444" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@company.com" className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(15,30,53,0.8)', border: '1px solid rgba(30,58,138,0.5)', color: '#f1f5f9' }} />
            </div>

            <div className="relative rounded-xl overflow-hidden border border-border bg-black aspect-video flex items-center justify-center">
              {stream ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              ) : (
                <Camera size={48} className="text-muted-foreground animate-pulse" />
              )}

              {/* Corner brackets overlay */}
              <div className="absolute inset-4 border-t-2 border-l-2 border-primary w-8 h-8 rounded-tl-sm pointer-events-none" />
              <div className="absolute inset-y-4 right-4 border-t-2 border-r-2 border-primary w-8 h-8 rounded-tr-sm pointer-events-none" />
              <div className="absolute bottom-4 left-4 border-b-2 border-l-2 border-primary w-8 h-8 rounded-bl-sm pointer-events-none" />
              <div className="absolute bottom-4 right-4 border-b-2 border-r-2 border-primary w-8 h-8 rounded-br-sm pointer-events-none" />

              {status === 'scanning' && (
                <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2">
                  <RefreshCw size={36} className="text-primary animate-spin" />
                  <span className="text-xs font-semibold text-white tracking-widest uppercase">Scanning Face...</span>
                  {/* Scanner line animation */}
                  <div className="absolute left-0 right-0 h-0.5 bg-primary animate-[bounce_2s_infinite] shadow-[0_0_10px_#3b82f6]" />
                </div>
              )}
            </div>

            <button onClick={captureAndVerify} disabled={status === 'scanning' || !stream}
              className="w-full py-3 rounded-xl font-semibold text-white mt-2 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', opacity: (status === 'scanning' || !stream) ? 0.7 : 1 }}>
              {status === 'scanning' ? 'Verifying...' : 'Capture & Verify'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
