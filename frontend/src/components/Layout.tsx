import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield,
  LayoutDashboard,
  AlertTriangle,
  Activity,
  Server,
  FileCheck,
  Cpu,
  Settings,
  LogOut,
  User,
  Bell
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Incidents', path: '/incidents', icon: AlertTriangle },
    { name: 'Threat Detection', path: '/threats', icon: Activity },
    { name: 'Assets', path: '/assets', icon: Server },
    { name: 'Compliance', path: '/compliance', icon: FileCheck },
    { name: 'AI Assistant', path: '/assistant', icon: Cpu },
    { name: 'Settings', path: '/settings', icon: Settings },
  ]

  const activeIndex = menuItems.findIndex(item => item.path === location.pathname)

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-md flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Shield className="w-8 h-8 text-primary mr-3" />
          <h1 className="text-xl font-bold tracking-tight text-white">AegisSec</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item, idx) => {
            const isActive = idx === activeIndex
            return (
              <Link key={item.name} to={item.path} className="block relative">
                {isActive && (
                  <motion.div layoutId="activeNav" className="absolute inset-0 rounded-xl bg-secondary/80 border-l-[3px] border-primary" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                )}
                <div className={`relative z-10 flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-white hover:bg-secondary/40'}`}>
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* User profile footer in sidebar */}
        <div className="p-4 border-t border-border flex flex-col gap-3">
          {user && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 text-primary font-bold">
                {user.full_name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
                <p className="text-xs text-muted-foreground truncate uppercase">{user.role}</p>
              </div>
            </div>
          )}
          <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-card/20 backdrop-blur-md z-10 shrink-0">
          <h2 className="text-lg font-bold text-white tracking-wide">
            {menuItems[activeIndex]?.name || 'Overview'}
          </h2>

          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-xl border border-border bg-card/40 hover:bg-secondary transition-colors relative">
              <Bell size={18} className="text-muted-foreground hover:text-white transition-colors" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
            </button>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/settings')}>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <User size={16} className="text-primary" />
              </div>
              <span className="text-sm font-medium text-white hidden md:inline">{user?.full_name}</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-auto bg-background/95">
          {children}
        </main>
      </div>
    </div>
  )
}
