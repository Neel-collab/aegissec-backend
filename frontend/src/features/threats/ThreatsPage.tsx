import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Activity, ShieldAlert, AlertTriangle, Search, Cpu, Globe, Sliders } from 'lucide-react'
import { threatsAPI, aiAPI } from '@/lib/api'

export default function ThreatsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'feed' | 'analyze-url' | 'analyze-network'>('feed')
  const [searchTerm, setSearchTerm] = useState('')

  // URL Analyzer State
  const [urlInput, setUrlInput] = useState('')
  const [urlResult, setUrlResult] = useState<any | null>(null)
  const [urlLoading, setUrlLoading] = useState(false)

  // Network Intrusion Analyzer State (using standard CIC-IDS2017 features)
  const [features, setFeatures] = useState<string>('80, 5, 0, 1000, 200, 100')
  const [networkResult, setNetworkResult] = useState<any | null>(null)
  const [networkLoading, setNetworkLoading] = useState(false)

  const { data: threats = [], isLoading, error } = useQuery({
    queryKey: ['threats'],
    queryFn: async () => {
      const res = await threatsAPI.getAll()
      return res.data
    }
  })

  const urlMutation = useMutation({
    mutationFn: async (url: string) => {
      setUrlLoading(true)
      const res = await aiAPI.analyzeURL(url)
      return res.data
    },
    onSuccess: (data) => {
      setUrlResult(data)
      setUrlLoading(false)
      queryClient.invalidateQueries({ queryKey: ['threats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] })
    },
    onError: () => {
      setUrlLoading(false)
    }
  })

  const networkMutation = useMutation({
    mutationFn: async (featArray: number[]) => {
      setNetworkLoading(true)
      const res = await aiAPI.analyzeNetwork(featArray)
      return res.data
    },
    onSuccess: (data) => {
      setNetworkResult(data)
      setNetworkLoading(false)
      queryClient.invalidateQueries({ queryKey: ['threats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] })
    },
    onError: () => {
      setNetworkLoading(false)
    }
  })

  const handleURLAnalyze = (e: React.FormEvent) => {
    e.preventDefault()
    urlMutation.mutate(urlInput)
  }

  const handleNetworkAnalyze = (e: React.FormEvent) => {
    e.preventDefault()
    const featArray = features.split(',').map(f => parseFloat(f.trim())).filter(f => !isNaN(f))
    networkMutation.mutate(featArray)
  }

  const filteredThreats = threats.filter((t: any) =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.threat_type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="h-10 w-48 bg-secondary/50 rounded-xl animate-pulse" />
        <div className="h-[400px] w-full bg-secondary/50 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 text-center text-destructive">
        <AlertTriangle size={48} className="mx-auto mb-4" />
        <p className="font-semibold text-lg">Failed to load threat detection data.</p>
        <p className="text-sm opacity-70 mt-1">Please ensure the backend server and MongoDB are running.</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-border gap-6">
        <button onClick={() => setActiveTab('feed')}
          className={`pb-3 text-sm font-semibold tracking-wider uppercase transition-colors relative ${activeTab === 'feed' ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}>
          Threat Feed
          {activeTab === 'feed' && <motion.div layoutId="activeThreatTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button onClick={() => setActiveTab('analyze-url')}
          className={`pb-3 text-sm font-semibold tracking-wider uppercase transition-colors relative ${activeTab === 'analyze-url' ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}>
          AI URL Analyzer
          {activeTab === 'analyze-url' && <motion.div layoutId="activeThreatTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button onClick={() => setActiveTab('analyze-network')}
          className={`pb-3 text-sm font-semibold tracking-wider uppercase transition-colors relative ${activeTab === 'analyze-network' ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}>
          AI Network Intrusion
          {activeTab === 'analyze-network' && <motion.div layoutId="activeThreatTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'feed' && (
        <div className="space-y-6">
          {/* Feed Filter */}
          <div className="relative w-full md:max-w-xs">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search threats..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm outline-none bg-card/40 border border-border text-white focus:border-primary/50" />
          </div>

          <div className="p-6 rounded-xl border border-border bg-card/40 backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-widest">
                    <th className="pb-3 pl-4">Threat Event</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Severity</th>
                    <th className="pb-3">Source IP</th>
                    <th className="pb-3">Target Host</th>
                    <th className="pb-3">MITRE ID</th>
                    <th className="pb-3 pr-4 text-right">Detected Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredThreats.map((threat: any) => (
                    <tr key={threat.id} className="border-b border-border/50 text-sm hover:bg-secondary/20 transition-colors group">
                      <td className="py-4 pl-4 font-semibold text-white group-hover:text-primary transition-colors">
                        <div className="flex flex-col">
                          <span>{threat.title}</span>
                          <span className="text-xs font-normal text-muted-foreground mt-0.5">{threat.description}</span>
                        </div>
                      </td>
                      <td className="py-4"><span className="px-2 py-0.5 rounded-md bg-secondary/80 text-xs font-mono text-white">{threat.threat_type}</span></td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                          threat.severity === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          threat.severity === 'High' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                          threat.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                          'bg-green-500/10 text-green-500 border border-green-500/20'
                        }`}>{threat.severity}</span>
                      </td>
                      <td className="py-4 text-xs font-mono text-white">{threat.source_ip || 'Internal System'}</td>
                      <td className="py-4 text-xs font-mono text-white">{threat.target_ip || 'Cloud Instance'}</td>
                      <td className="py-4 text-xs font-mono text-muted-foreground">{threat.mitre_technique || 'N/A'}</td>
                      <td className="py-4 pr-4 text-right text-xs text-muted-foreground font-mono">
                        {new Date(threat.detected_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analyze-url' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 p-6 rounded-xl border border-border bg-card/40 backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="text-primary w-5 h-5" />
              <h3 className="font-bold text-white">Phishing Link Analyzer</h3>
            </div>
            <p className="text-sm text-muted-foreground">Submit a domain or complete URL path to run real-time heuristic checks against credential harvesting indicators.</p>
            <form onSubmit={handleURLAnalyze} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Target URL</label>
                <input type="text" value={urlInput} onChange={e => setUrlInput(e.target.value)} required
                  placeholder="https://secure-login-update-auth.com/verification" className="w-full px-4 py-3 rounded-xl text-sm bg-background border border-border text-white outline-none" />
              </div>
              <button type="submit" disabled={urlLoading}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/95 transition-all">
                {urlLoading ? 'Running AI Scan...' : 'Analyze Destination'}
              </button>
            </form>
          </div>

          {/* Results Display */}
          <div className="p-6 rounded-xl border border-border bg-card/40 backdrop-blur-sm flex flex-col justify-between">
            <h3 className="font-bold text-white mb-4">Inspection Report</h3>
            {urlResult ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">Classification</span>
                    <p className={`text-xl font-bold mt-1 ${urlResult.label === 'Phishing' ? 'text-destructive animate-pulse' : 'text-green-500'}`}>
                      {urlResult.label}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">Confidence Metric</span>
                    <p className="text-sm font-mono text-white mt-1">{(urlResult.confidence * 100).toFixed(1)}%</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-4">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Calculated Risk Score</span>
                  <div className="flex items-center gap-4">
                    <span className={`text-5xl font-black ${urlResult.risk_score > 70 ? 'text-destructive' : 'text-green-500'}`}>
                      {urlResult.risk_score}
                    </span>
                    <span className="text-xs text-muted-foreground leading-normal">Score out of 100 based on standard heuristics mapping.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-xl">
                <Cpu size={32} className="text-muted-foreground mb-2 animate-bounce" />
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Awaiting Analysis</span>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'analyze-network' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 p-6 rounded-xl border border-border bg-card/40 backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="text-primary w-5 h-5" />
              <h3 className="font-bold text-white">Network Anomaly Vector</h3>
            </div>
            <p className="text-sm text-muted-foreground">Provide flow parameters derived from netflow dumps (Destination Port, Flow Duration, Total Forward Packets, Flow Bytes/s, Flow Packets/s, Average Packet Size).</p>
            <form onSubmit={handleNetworkAnalyze} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Flow Features (Comma Separated)</label>
                <input type="text" value={features} onChange={e => setFeatures(e.target.value)} required
                  placeholder="80, 5, 0, 1000, 200, 100" className="w-full px-4 py-3 rounded-xl text-sm bg-background border border-border text-white outline-none font-mono" />
              </div>
              <button type="submit" disabled={networkLoading}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/95 transition-all">
                {networkLoading ? 'Evaluating Flow Vector...' : 'Scan Traffic Flow'}
              </button>
            </form>
          </div>

          {/* Results Display */}
          <div className="p-6 rounded-xl border border-border bg-card/40 backdrop-blur-sm flex flex-col justify-between">
            <h3 className="font-bold text-white mb-4">Inspection Report</h3>
            {networkResult ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">Classification</span>
                    <p className={`text-xl font-bold mt-1 ${networkResult.label !== 'Normal' ? 'text-destructive animate-pulse' : 'text-green-500'}`}>
                      {networkResult.label}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">Confidence Metric</span>
                    <p className="text-sm font-mono text-white mt-1">{(networkResult.confidence * 100).toFixed(1)}%</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-4">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Calculated Risk Score</span>
                  <div className="flex items-center gap-4">
                    <span className={`text-5xl font-black ${networkResult.risk_score > 70 ? 'text-destructive' : 'text-green-500'}`}>
                      {networkResult.risk_score}
                    </span>
                    <span className="text-xs text-muted-foreground leading-normal">Score out of 100 based on standard heuristics mapping.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-xl">
                <ShieldAlert size={32} className="text-muted-foreground mb-2 animate-bounce" />
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Awaiting Analysis</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
