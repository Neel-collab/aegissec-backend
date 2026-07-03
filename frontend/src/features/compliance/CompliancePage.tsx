import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FileCheck, AlertTriangle, CheckCircle, Clock, ToggleLeft } from 'lucide-react'
import { complianceAPI } from '@/lib/api'

export default function CompliancePage() {
  const queryClient = useQueryClient()
  const [selectedFramework, setSelectedFramework] = useState<any | null>(null)

  const { data: frameworks = [], isLoading, error } = useQuery({
    queryKey: ['compliance'],
    queryFn: async () => {
      const res = await complianceAPI.getAll()
      return res.data
    }
  })

  const controlMutation = useMutation({
    mutationFn: async ({ frameworkId, controlId, status }: { frameworkId: string, controlId: string, status: string }) => {
      return complianceAPI.updateControl(frameworkId, controlId, { status })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['compliance'] })
      // Keep selected framework controls updated
      if (selectedFramework && selectedFramework.id === variables.frameworkId) {
        setSelectedFramework((prev: any) => {
          const updatedControls = prev.controls.map((c: any) =>
            c.control_id === variables.controlId ? { ...c, status: variables.status } : c
          )
          const passed = updatedControls.filter((c: any) => c.status === 'Pass').length
          const score = roundScore((passed / updatedControls.length) * 100)
          return { ...prev, controls: updatedControls, score }
        })
      }
    }
  })

  const roundScore = (num: number) => Math.round(num * 10) / 10

  const handleToggleStatus = (frameworkId: string, controlId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Pass' ? 'Fail' : currentStatus === 'Fail' ? 'In Progress' : 'Pass'
    controlMutation.mutate({ frameworkId, controlId, status: nextStatus })
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-3 gap-6 animate-pulse">
          {[1,2,3].map(n => <div key={n} className="h-40 rounded-xl bg-secondary/50" />)}
        </div>
        <div className="h-[300px] w-full bg-secondary/50 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        <AlertTriangle size={48} className="mx-auto mb-4" />
        <p className="font-semibold text-lg">Failed to load compliance frameworks.</p>
        <p className="text-sm opacity-70 mt-1">Please ensure the backend server and MongoDB are running.</p>
      </div>
    )
  }

  // Set default selection on initial load
  if (frameworks.length > 0 && !selectedFramework) {
    setSelectedFramework(frameworks[0])
  }

  return (
    <div className="p-8 space-y-6">
      {/* Framework Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {frameworks.map((fw: any) => {
          const isSelected = selectedFramework && selectedFramework.id === fw.id
          const passed = fw.controls.filter((c: any) => c.status === 'Pass').length
          const total = fw.controls.length

          return (
            <div key={fw.id} onClick={() => setSelectedFramework(fw)}
              className={`p-6 rounded-xl border transition-all cursor-pointer flex flex-col justify-between h-44 ${
                isSelected ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-border bg-card/40 hover:border-muted'
              }`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-lg">{fw.framework}</h3>
                  <span className="text-xs text-muted-foreground">Version {fw.version}</span>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-secondary flex items-center justify-center relative">
                  <span className="text-xs font-black text-white">{fw.score}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Passed Controls</span>
                  <span>{passed}/{total}</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${fw.score}%` }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Control Checklist Table */}
      {selectedFramework && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} key={selectedFramework.id}
          className="p-6 rounded-xl border border-border bg-card/40 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <FileCheck className="text-primary w-5 h-5" />
            <h3 className="font-bold text-white uppercase tracking-wider text-sm">{selectedFramework.framework} Control Audit</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-widest">
                  <th className="pb-3 pl-4">Control ID</th>
                  <th className="pb-3">Title</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Evidence Artifact</th>
                  <th className="pb-3">Audit Status</th>
                  <th className="pb-3 pr-4 text-right">Cycle Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedFramework.controls.map((control: any) => (
                  <tr key={control.control_id} className="border-b border-border/50 text-sm hover:bg-secondary/20 transition-colors">
                    <td className="py-4 pl-4 font-mono text-xs font-semibold text-white">{control.control_id}</td>
                    <td className="py-4 font-semibold text-white">{control.title}</td>
                    <td className="py-4 text-xs text-muted-foreground max-w-xs">{control.description}</td>
                    <td className="py-4 text-xs text-muted-foreground font-mono">{control.evidence || 'No evidence loaded'}</td>
                    <td className="py-4">
                      <span className={`flex items-center gap-1.5 text-xs font-bold ${
                        control.status === 'Pass' ? 'text-green-500' :
                        control.status === 'Fail' ? 'text-red-500 animate-pulse' :
                        'text-yellow-500'
                      }`}>
                        {control.status === 'Pass' && <CheckCircle size={14} />}
                        {control.status === 'Fail' && <AlertTriangle size={14} />}
                        {control.status === 'In Progress' && <Clock size={14} />}
                        {control.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <button onClick={() => handleToggleStatus(selectedFramework.id, control.control_id, control.status)}
                        className="p-2 rounded-lg bg-secondary/80 hover:bg-primary/25 border border-border text-muted-foreground hover:text-white transition-all">
                        <ToggleLeft size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}
