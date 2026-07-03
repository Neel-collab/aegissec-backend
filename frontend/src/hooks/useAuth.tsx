import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { authAPI } from '@/lib/api'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  department?: string
  phone?: string
  mfa_enabled: boolean
  has_face_id: boolean
  created_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ requires_mfa: boolean; user_id?: string }>
  logout: () => void
  setToken: (token: string) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(localStorage.getItem('aegis_token'))
  const [isLoading, setIsLoading] = useState(true)

  const setToken = (t: string) => {
    localStorage.setItem('aegis_token', t)
    setTokenState(t)
  }

  const refreshUser = async () => {
    try {
      const res = await authAPI.getMe()
      setUser(res.data)
    } catch {
      localStorage.removeItem('aegis_token')
      setTokenState(null)
      setUser(null)
    }
  }

  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem('aegis_token')
      if (stored) {
        setTokenState(stored)
        await refreshUser()
      }
      setIsLoading(false)
    }
    init()
  }, [])

  const login = async (email: string, password: string) => {
    const res = await authAPI.login(email, password)
    const data = res.data
    if (data.requires_mfa) {
      return { requires_mfa: true, user_id: data.user_id }
    }
    setToken(data.access_token)
    await refreshUser()
    return { requires_mfa: false }
  }

  const logout = () => {
    localStorage.removeItem('aegis_token')
    setTokenState(null)
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, logout, setToken, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
