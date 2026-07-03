import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Plus, X, Search, Filter, ShieldAlert } from 'lucide-react'
import { incidentsAPI } from '@/lib/api'

export default function IncidentsPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Form State
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newSeverity, setNewSeverity] = useState('High')
  const [newAssignedTo, setNewAssignedTo] = useState('')

  const { data: incidents = [], isLoading, error } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await incidentsAPI.getAll()
      return res.data
    }
  })

  const createMutation = useMutation({
    mutationFn: async (incident: any) => {
      return incidentsAPI.create(incident)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      setIsCreateOpen(false)
      setNewTitle('')
      setNewDescription('')
      setNewSeverity('High')
      setNewAssignedTo('')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      return incidentsAPI.update(id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      if (selectedIncident) {
        setSelectedIncident((prev: any) => ({ ...prev, ...updateMutation.variables?.updates }))
      }
    }
  })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      title: newTitle,
      description: newDescription,
      severity: newSeverity,
      assigned_to: newAssignedTo || null,
      status: 'Open'
    })
  }

  const handleUpdateStatus = (id: string, newStatus: string) => {
    updateMutation.mutate({ id, updates: { status: newStatus } })
  }

  const filteredIncidents = incidents.filter((inc: any) => {
    const matchesSearch = inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inc.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = severityFilter === 'All' || inc.severity === severityFilter
    const matchesStatus = statusFilter === 'All' || inc.status === statusFilter
    return matchesSearch && matchesSeverity && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-10 w-full bg-secondary/50 rounded-xl animate-pulse" />
        <div className="h-[400px] w-full bg-secondary/50 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        <AlertTriangle size={48} className="mx-auto mb-4" />
        <p className="font-semibold text-lg">Failed to load incidents feed.</p>
        <p className="text-sm opacity-70 mt-1">Please ensure the backend server and MongoDB are running.</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 relative h-full">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-full md:max-w-xs">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search incidents..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm outline-none bg-card/40 border border-border text-white placeholder:text-muted-foreground focus:border-primary/50 transition-colors" />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-card/40 border border-border text-muted-foreground outline-none cursor-pointer">
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-card/40 border border-border text-muted-foreground outline-none cursor-pointer">
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        <button onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 shrink-0">
          <Plus size={16} />
          <span>New Incident</span>
        </button>
      </div>

      {/* Incidents Table */}
      <div className="p-6 rounded-xl border border-border bg-card/40 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-widest">
                <th className="pb-3 pl-4">Incident Case</th>
                <th className="pb-3">Severity</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Assignee</th>
                <th className="pb-3 pr-4 text-right">Registered Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length > 0 ? (
                filteredIncidents.map((inc: any) => (
                  <tr key={inc.id} onClick={() => setSelectedIncident(inc)}
                    className="border-b border-border/50 text-sm hover:bg-secondary/20 transition-colors group cursor-pointer">
                    <td className="py-4 pl-4 font-semibold text-white group-hover:text-primary transition-colors">
                      <div className="flex flex-col">
                        <span>{inc.title}</span>
                        <span className="text-xs font-normal text-muted-foreground mt-0.5 line-clamp-1">{inc.description}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                        inc.severity === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        inc.severity === 'High' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                        inc.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                        'bg-green-500/10 text-green-500 border border-green-500/20'
                      }`}>{inc.severity}</span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        inc.status === 'Open' ? 'bg-destructive/15 text-destructive' :
                        inc.status === 'In Progress' ? 'bg-yellow-500/15 text-yellow-500' :
                        'bg-green-500/15 text-green-500'
                      }`}>{inc.status}</span>
                    </td>
                    <td className="py-4 text-white font-mono text-xs">{inc.assigned_to || 'Unassigned'}</td>
                    <td className="py-4 pr-4 text-right text-xs text-muted-foreground font-mono">
                      {new Date(inc.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No matching incidents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Slide-in Detail Drawer */}
      <AnimatePresence>
        {selectedIncident && (
          <>
            {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => setSelectedIncident(null)}
              className="absolute inset-0 bg-black z-20 cursor-pointer" />
            {/* Drawer */}
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-30 p-6 flex flex-col justify-between shadow-2xl">
              <div className="space-y-6 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="text-primary w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Incident Details</span>
                  </div>
                  <button onClick={() => setSelectedIncident(null)} className="p-1.5 rounded-lg border border-border hover:bg-secondary transition-colors">
                    <X size={16} className="text-muted-foreground hover:text-white" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-muted-foreground">Title</h4>
                    <p className="text-lg font-bold text-white mt-1">{selectedIncident.title}</p>
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-muted-foreground">Description</h4>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">{selectedIncident.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs uppercase tracking-widest text-muted-foreground">Severity</h4>
                      <div className="mt-1.5">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                          selectedIncident.severity === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          selectedIncident.severity === 'High' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                          selectedIncident.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                          'bg-green-500/10 text-green-500 border border-green-500/20'
                        }`}>{selectedIncident.severity}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs uppercase tracking-widest text-muted-foreground">Assigned To</h4>
                      <p className="text-sm text-white mt-1.5 font-semibold">{selectedIncident.assigned_to || 'Unassigned'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Triage & Actions</h4>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateStatus(selectedIncident.id, 'In Progress')} disabled={selectedIncident.status === 'In Progress'}
                        className="flex-1 py-2 text-xs font-semibold text-white border border-border bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors">
                        Assign Progress
                      </button>
                      <button onClick={() => handleUpdateStatus(selectedIncident.id, 'Resolved')} disabled={selectedIncident.status === 'Resolved'}
                        className="flex-1 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors">
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Incident Modal Dialog */}
      <AnimatePresence>
        {isCreateOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setIsCreateOpen(false)}
              className="absolute inset-0 bg-black z-40 cursor-pointer" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-2xl p-6 z-50 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="font-bold text-white">Create Security Incident</span>
                <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded-lg hover:bg-secondary transition-colors">
                  <X size={18} className="text-muted-foreground hover:text-white" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Incident Title</label>
                  <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} required
                    placeholder="e.g. Critical Brute Force Alert" className="w-full px-4 py-2.5 rounded-xl text-sm bg-background border border-border text-white outline-none" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Description</label>
                  <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} required rows={3}
                    placeholder="Describe the anomalies, source IP address or impacted systems..." className="w-full px-4 py-2.5 rounded-xl text-sm bg-background border border-border text-white outline-none resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Severity</label>
                    <select value={newSeverity} onChange={e => setNewSeverity(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm bg-background border border-border text-white outline-none cursor-pointer">
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Assignee</label>
                    <input type="text" value={newAssignedTo} onChange={e => setNewAssignedTo(e.target.value)}
                      placeholder="Name" className="w-full px-4 py-2.5 rounded-xl text-sm bg-background border border-border text-white outline-none" />
                  </div>
                </div>

                <button type="submit" disabled={createMutation.isPending}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/95 transition-all shadow-lg shadow-primary/20">
                  {createMutation.isPending ? 'Logging Incident...' : 'Log Security Incident'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
