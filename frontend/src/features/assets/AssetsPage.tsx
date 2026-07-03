import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Server, Plus, X, Search, Filter, AlertTriangle, Cpu, Terminal } from 'lucide-react'
import { assetsAPI } from '@/lib/api'

export default function AssetsPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [criticalityFilter, setCriticalityFilter] = useState('All')
  const [isAddOpen, setIsAddOpen] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [assetType, setAssetType] = useState('Server')
  const [ipAddress, setIpAddress] = useState('')
  const [os, setOs] = useState('')
  const [owner, setOwner] = useState('')
  const [criticality, setCriticality] = useState('Medium')

  const { data: assets = [], isLoading, error } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const res = await assetsAPI.getAll()
      return res.data
    }
  })

  const { data: stats } = useQuery({
    queryKey: ['assetStats'],
    queryFn: async () => {
      const res = await assetsAPI.getStats()
      return res.data
    }
  })

  const addMutation = useMutation({
    mutationFn: async (asset: any) => {
      return assetsAPI.create(asset)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['assetStats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] })
      setIsAddOpen(false)
      setName('')
      setAssetType('Server')
      setIpAddress('')
      setOs('')
      setOwner('')
      setCriticality('Medium')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return assetsAPI.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['assetStats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] })
    }
  })

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addMutation.mutate({
      name,
      asset_type: assetType,
      ip_address: ipAddress || null,
      os: os || null,
      owner: owner || null,
      criticality,
    })
  }

  const filteredAssets = assets.filter((asset: any) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (asset.ip_address && asset.ip_address.includes(searchTerm))
    const matchesType = typeFilter === 'All' || asset.asset_type === typeFilter
    const matchesCriticality = criticalityFilter === 'All' || asset.criticality === criticalityFilter
    return matchesSearch && matchesType && matchesCriticality
  })

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-4 gap-6 animate-pulse">
          {[1,2,3,4].map(n => <div key={n} className="h-24 rounded-xl bg-secondary/50" />)}
        </div>
        <div className="h-[400px] w-full bg-secondary/50 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        <AlertTriangle size={48} className="mx-auto mb-4" />
        <p className="font-semibold text-lg">Failed to load asset inventory.</p>
        <p className="text-sm opacity-70 mt-1">Please ensure the backend server and MongoDB are running.</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 relative h-full">
      {/* Metric Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-4 rounded-xl border border-border bg-card/40 backdrop-blur-sm">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Systems</span>
            <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card/40 backdrop-blur-sm">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Critical Servers</span>
            <p className="text-2xl font-black text-red-500 mt-1">{stats.by_criticality.Critical || 0}</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card/40 backdrop-blur-sm">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Endpoints</span>
            <p className="text-2xl font-black text-primary mt-1">{stats.by_type.Endpoint || 0}</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card/40 backdrop-blur-sm">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Firewalls / Gateway</span>
            <p className="text-2xl font-black text-yellow-500 mt-1">{stats.by_type.Firewall || 0}</p>
          </div>
        </div>
      )}

      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-full md:max-w-xs">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search systems..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2 bg-card/40 border border-border text-white rounded-xl focus:border-primary/50 outline-none text-sm" />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs bg-card/40 border border-border text-muted-foreground outline-none cursor-pointer">
              <option value="All">All Types</option>
              <option value="Server">Servers</option>
              <option value="Endpoint">Endpoints</option>
              <option value="Firewall">Firewalls</option>
              <option value="Router">Routers</option>
              <option value="Database">Databases</option>
              <option value="Cloud">Cloud Resources</option>
            </select>

            <select value={criticalityFilter} onChange={e => setCriticalityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs bg-card/40 border border-border text-muted-foreground outline-none cursor-pointer">
              <option value="All">All Criticalities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <button onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/95 transition-all shrink-0">
          <Plus size={16} />
          <span>Add Asset</span>
        </button>
      </div>

      {/* Assets Table */}
      <div className="p-6 rounded-xl border border-border bg-card/40 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-widest">
                <th className="pb-3 pl-4">System Identity</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">OS</th>
                <th className="pb-3">Criticality</th>
                <th className="pb-3">Network IP</th>
                <th className="pb-3">Risk Index</th>
                <th className="pb-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset: any) => (
                <tr key={asset.id} className="border-b border-border/50 text-sm hover:bg-secondary/20 transition-colors group">
                  <td className="py-4 pl-4 font-semibold text-white group-hover:text-primary transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary/80 border border-border rounded-lg">
                        <Server size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex flex-col">
                        <span>{asset.name}</span>
                        <span className="text-xs font-normal text-muted-foreground mt-0.5">{asset.department || 'General Network'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4"><span className="px-2 py-0.5 rounded-md bg-secondary/80 text-xs font-mono text-white">{asset.asset_type}</span></td>
                  <td className="py-4 text-xs font-mono text-white">{asset.os || 'N/A'}</td>
                  <td className="py-4">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                      asset.criticality === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                      asset.criticality === 'High' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                      asset.criticality === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                      'bg-green-500/10 text-green-500 border border-green-500/20'
                    }`}>{asset.criticality}</span>
                  </td>
                  <td className="py-4 text-xs font-mono text-white">{asset.ip_address || 'Cloud Gateway'}</td>
                  <td className="py-4 font-mono font-bold text-white">{asset.risk_score}</td>
                  <td className="py-4 pr-4 text-right">
                    <button onClick={() => deleteMutation.mutate(asset.id)} disabled={deleteMutation.isPending}
                      className="text-xs font-bold text-destructive hover:bg-destructive/15 px-3 py-1.5 rounded-lg border border-transparent hover:border-destructive/25 transition-all">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Asset Dialog Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setIsAddOpen(false)}
              className="absolute inset-0 bg-black/60 z-40 cursor-pointer" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-2xl p-6 z-50 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="text-primary w-5 h-5" />
                  <span className="font-bold text-white">Enroll Network Asset</span>
                </div>
                <button onClick={() => setIsAddOpen(false)} className="p-1 rounded-lg hover:bg-secondary transition-colors">
                  <X size={18} className="text-muted-foreground hover:text-white" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Asset Identity Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required
                    placeholder="e.g. Core Database Server 02" className="w-full px-4 py-2.5 rounded-xl text-sm bg-background border border-border text-white outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Category Type</label>
                    <select value={assetType} onChange={e => setAssetType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm bg-background border border-border text-white outline-none cursor-pointer">
                      <option value="Server">Server</option>
                      <option value="Endpoint">Endpoint</option>
                      <option value="Firewall">Firewall</option>
                      <option value="Router">Router</option>
                      <option value="Database">Database</option>
                      <option value="Cloud">Cloud Resource</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Criticality</label>
                    <select value={criticality} onChange={e => setCriticality(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm bg-background border border-border text-white outline-none cursor-pointer">
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Network IP</label>
                    <input type="text" value={ipAddress} onChange={e => setIpAddress(e.target.value)}
                      placeholder="e.g. 10.0.1.12" className="w-full px-4 py-2.5 rounded-xl text-sm bg-background border border-border text-white outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Operating System</label>
                    <input type="text" value={os} onChange={e => setOs(e.target.value)}
                      placeholder="e.g. Ubuntu 22.04" className="w-full px-4 py-2.5 rounded-xl text-sm bg-background border border-border text-white outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">System Owner Department</label>
                  <input type="text" value={owner} onChange={e => setOwner(e.target.value)}
                    placeholder="e.g. Devops Engineering" className="w-full px-4 py-2.5 rounded-xl text-sm bg-background border border-border text-white outline-none" />
                </div>

                <button type="submit" disabled={addMutation.isPending}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/95 transition-all shadow-lg shadow-primary/20">
                  {addMutation.isPending ? 'Enrolling Asset...' : 'Enroll Asset System'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
