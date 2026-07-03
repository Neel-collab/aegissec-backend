import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Shield, AlertTriangle, Server, Gauge, TrendingUp } from 'lucide-react'
import { dashboardAPI } from '@/lib/api'

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await dashboardAPI.getStats()
      return res.data
    },
    refetchInterval: 5000, // Real-time poll every 5s
  })

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 rounded-xl bg-secondary/50 border border-border" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="lg:col-span-2 h-[400px] rounded-xl bg-secondary/50 border border-border" />
          <div className="h-[400px] rounded-xl bg-secondary/50 border border-border" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        <AlertTriangle size={48} className="mx-auto mb-4" />
        <p className="font-semibold text-lg">Failed to load dashboard statistics.</p>
        <p className="text-sm opacity-70 mt-1">Please ensure the backend server and MongoDB are running.</p>
      </div>
    )
  }

  const {
    total_threats,
    active_threats,
    open_incidents,
    critical_incidents,
    total_assets,
    risk_score,
    threats_by_type,
    threats_by_severity,
    incidents_by_status,
    compliance_score,
    recent_threats,
    threat_timeline
  } = data

  const statCards = [
    { title: 'Active Threats', value: active_threats, sub: 'Requiring Triage', icon: Shield, color: 'text-destructive', bg: 'bg-destructive/15' },
    { title: 'Open Incidents', value: open_incidents, sub: `${critical_incidents} Critical`, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/15' },
    { title: 'Monitored Assets', value: total_assets, sub: 'Active Inventory', icon: Server, color: 'text-primary', bg: 'bg-primary/15' },
    { title: 'Risk Score', value: `${risk_score}/100`, sub: 'Environment Rating', icon: Gauge, color: risk_score > 70 ? 'text-destructive' : risk_score > 40 ? 'text-yellow-500' : 'text-green-500', bg: risk_score > 70 ? 'bg-destructive/15' : risk_score > 40 ? 'bg-yellow-500/15' : 'bg-green-500/15' },
  ]

  // Pie chart formatting
  const pieData = Object.entries(threats_by_type).map(([name, value]) => ({ name, value }))
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981']

  return (
    <div className="p-8 space-y-6">
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-xl border border-border bg-card/40 backdrop-blur-sm flex items-center justify-between group hover:border-primary/40 transition-colors">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{card.title}</span>
              <p className={`text-3xl font-extrabold tracking-tight ${card.color}`}>{card.value}</p>
              <span className="text-xs text-muted-foreground block">{card.sub}</span>
            </div>
            <div className={`p-4 rounded-xl ${card.bg} border border-border group-hover:scale-110 transition-transform`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Area Chart */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="lg:col-span-2 p-6 rounded-xl border border-border bg-card/40 backdrop-blur-sm flex flex-col h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-primary" />
            <h3 className="text-sm font-semibold tracking-wider text-white uppercase">Threat Activity Timeline</h3>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={threat_timeline}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0d1b2a', borderColor: '#1e3a5f', borderRadius: '8px', color: '#fff' }} />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Categories Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="p-6 rounded-xl border border-border bg-card/40 backdrop-blur-sm flex flex-col h-[400px]">
          <h3 className="text-sm font-semibold tracking-wider text-white uppercase mb-6">Attack Categories</h3>
          <div className="flex-1 relative flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0d1b2a', borderColor: '#1e3a5f', borderRadius: '8px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-muted-foreground">No active threat category data.</span>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white">{total_threats}</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Threats Total</span>
            </div>
          </div>
          {/* Legend Grid */}
          <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] text-muted-foreground uppercase tracking-wider max-h-[80px] overflow-y-auto">
            {pieData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Alerts Feed Table */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="p-6 rounded-xl border border-border bg-card/40 backdrop-blur-sm">
        <h3 className="text-sm font-semibold tracking-wider text-white uppercase mb-6">Recent Alerts Feed</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-widest">
                <th className="pb-3 pl-4">Threat Case</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Severity</th>
                <th className="pb-3">Risk Score</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 pr-4 text-right">Time Detected</th>
              </tr>
            </thead>
            <tbody>
              {recent_threats.map((threat: any) => (
                <tr key={threat.id} className="border-b border-border/50 text-sm hover:bg-secondary/20 transition-colors group">
                  <td className="py-3.5 pl-4 font-semibold text-white group-hover:text-primary transition-colors">{threat.title}</td>
                  <td className="py-3.5"><span className="px-2 py-0.5 rounded-md bg-secondary/80 text-xs font-mono text-white">{threat.threat_type}</span></td>
                  <td className="py-3.5">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                      threat.severity === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                      threat.severity === 'High' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                      threat.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                      'bg-green-500/10 text-green-500 border border-green-500/20'
                    }`}>{threat.severity}</span>
                  </td>
                  <td className="py-3.5 font-mono text-white font-semibold">{threat.risk_score}</td>
                  <td className="py-3.5">
                    <span className={`w-2 h-2 rounded-full inline-block mr-2 ${
                      threat.status === 'Active' ? 'bg-destructive animate-pulse' :
                      threat.status === 'Investigating' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <span className="text-xs text-muted-foreground">{threat.status}</span>
                  </td>
                  <td className="py-3.5 pr-4 text-right text-xs text-muted-foreground font-mono">
                    {new Date(threat.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
