import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Cpu, Send, ShieldAlert, CornerDownLeft } from 'lucide-react'
import { aiAPI } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

export default function AssistantPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', text: `Hi ${user?.full_name || 'there'}! I'm the AegisSec AI Security Assistant. Ask me anything about your current active threats, logs, risk scores, or incident mitigations.`, time: new Date() }
  ])
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const chatMutation = useMutation({
    mutationFn: async ({ msg, history }: { msg: string, history: any[] }) => {
        const formattedHistory = history.map(m => ({ role: m.role, message: m.text }));
        const payload = [...formattedHistory, { role: 'user', message: msg }];
        const res = await aiAPI.chat(payload);
        return res;
      },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: 'assistant', text: data.response, time: new Date() }])
    },
    onError: () => {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error contacting security model. Ensure database and API are running.', time: new Date(), isError: true }])
    }
  })

  useEffect(() => {
    listRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || chatMutation.isPending) return

    const userMessage = { role: 'user', text: input, time: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput('')

    chatMutation.mutate({ msg: input, history: messages })
  }

  const handleSuggest = (text: string) => {
    if (chatMutation.isPending) return
    setMessages(prev => [...prev, { role: 'user', text, time: new Date() }])
    chatMutation.mutate({ msg: text, history: messages })
  }

  const suggestions = [
    'Show active threats',
    'Mitigate DDoS attacks',
    'Explain my risk factors',
    'Review PCI compliance status',
  ]

  return (
    <div className="p-4 md:p-8 h-[calc(100vh-4rem)] flex flex-col justify-between gap-6">
      {/* Suggestions Row */}
      <div className="flex flex-wrap gap-2">
        {suggestions.map(s => (
          <button key={s} onClick={() => handleSuggest(s)} disabled={chatMutation.isPending}
            className="px-3 py-1.5 rounded-lg border border-border bg-card/40 hover:bg-secondary text-xs text-muted-foreground hover:text-white transition-all disabled:opacity-50">
            {s}
          </button>
        ))}
      </div>

      {/* Chat Display Container */}
      <div className="flex-1 rounded-xl border border-border bg-card/30 backdrop-blur-sm p-6 overflow-y-auto flex flex-col space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user'
          return (
            <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 max-w-[80%] ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`}>
              <div className={`p-2 rounded-xl border shrink-0 h-10 w-10 flex items-center justify-center ${
                isUser ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-secondary border-border text-muted-foreground'
              }`}>
                {isUser ? 'ME' : <Cpu size={16} />}
              </div>
              <div className={`p-4 rounded-2xl border text-sm leading-relaxed whitespace-pre-line ${
                isUser ? 'bg-primary/5 border-primary/20 text-white' :
                m.isError ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-secondary/40 border-border text-muted-foreground'
              }`}>
                {m.text}
              </div>
            </motion.div>
          )
        })}
        {chatMutation.isPending && (
          <div className="flex gap-3 self-start max-w-[80%]">
            <div className="p-2 rounded-xl border bg-secondary border-border text-muted-foreground shrink-0 h-10 w-10 flex items-center justify-center">
              <Cpu size={16} className="animate-spin" />
            </div>
            <div className="p-4 rounded-2xl border bg-secondary/40 border-border text-sm flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={listRef} />
      </div>

      {/* Input Box Form */}
      <form onSubmit={handleSend} className="relative">
        <input type="text" value={input} onChange={e => setInput(e.target.value)} required
          placeholder="Ask AI Security assistant to summarize cases, run mitigations, or analyze vectors..."
          className="w-full pl-6 pr-16 py-4 rounded-xl text-sm bg-card/40 border border-border text-white focus:border-primary/50 outline-none" />
        <button type="submit" disabled={chatMutation.isPending || !input.trim()}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary hover:bg-primary/95 text-white disabled:opacity-50 transition-colors">
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
