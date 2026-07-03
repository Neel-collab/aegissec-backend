import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import MFAPage from '@/pages/MFAPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import FaceLoginPage from '@/pages/FaceLoginPage'

// Lazy load features
import DashboardPage from '@/features/dashboard/DashboardPage'
import IncidentsPage from '@/features/incidents/IncidentsPage'
import ThreatsPage from '@/features/threats/ThreatsPage'
import AssetsPage from '@/features/assets/AssetsPage'
import CompliancePage from '@/features/compliance/CompliancePage'
import AssistantPage from '@/features/assistant/AssistantPage'
import SettingsPage from '@/features/settings/SettingsPage'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/mfa" element={<MFAPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/face-login" element={<FaceLoginPage />} />

        {/* Protected Routes */}
        <Route path="/" element={<AuthGuard><DashboardPage /></AuthGuard>} />
        <Route path="/incidents" element={<AuthGuard><IncidentsPage /></AuthGuard>} />
        <Route path="/threats" element={<AuthGuard><ThreatsPage /></AuthGuard>} />
        <Route path="/assets" element={<AuthGuard><AssetsPage /></AuthGuard>} />
        <Route path="/compliance" element={<AuthGuard><CompliancePage /></AuthGuard>} />
        <Route path="/assistant" element={<AuthGuard><AssistantPage /></AuthGuard>} />
        <Route path="/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
