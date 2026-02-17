import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useCoachStore } from '@/stores/coachStore'
import { useCascadeStore } from '@/stores/cascadeStore'
import { useUIStore } from '@/stores/uiStore'
import { CoachModeSelector } from './CoachModeSelector'
import { NodeContextBadge } from './NodeContextBadge'
import { Button } from '@/components/common/Button'

export function ChatPanel() {
  const messages = useCoachStore((s) => s.messages)
  const streaming = useCoachStore((s) => s.streaming)
  const sendMessage = useCoachStore((s) => s.sendMessage)
  const clearMessages = useCoachStore((s) => s.clearMessages)
  const checkCanUse = useCoachStore((s) => s.canUseAI)
  const getRemaining = useCoachStore((s) => s.getRemainingUses)
  const t = useUIStore((s) => s.t)
  const remaining = getRemaining()

  const nodes = useCascadeStore((s) => s.nodes)
  const getProgress = useCascadeStore((s) => s.getProgress)

  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const buildKpiContext = () => {
    return nodes
      .filter((n) => n.depth === 0 || n.depth === 1)
      .map((n) => {
        const p = getProgress(n.id)
        return `[depth${n.depth}] ${n.emoji} ${n.title}: ${Math.round(p)}% (status: ${n.status})`
      })
      .join('\n')
  }

  const handleSend = async () => {
    if (!input.trim() || streaming) return
    const msg = input.trim()
    setInput('')
    await sendMessage(msg, buildKpiContext())
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-surface-border">
        <CoachModeSelector />
        <Button variant="ghost" size="sm" onClick={clearMessages}>지우기</Button>
      </div>

      <NodeContextBadge />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            <span className="text-4xl block mb-3">🤖</span>
            <p className="text-sm">KPI에 대해 질문해 보세요</p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {['위험 KPI 분석해줘', '진행률 높일 방법은?', '이번 주 보고서 작성'].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="text-xs px-3 py-1.5 rounded-full bg-surface-light border border-surface-border
                    hover:border-primary/30 text-text-muted hover:text-text transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.filter((m) => m.role !== 'system').map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap
                ${msg.role === 'user'
                  ? 'bg-primary/15 text-text rounded-br-sm'
                  : 'bg-surface-light text-text rounded-bl-sm border border-surface-border'
                }`}
            >
              {msg.content || (streaming ? '...' : '')}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-surface-border">
        {remaining !== Infinity && (
          <div className={`text-[10px] mb-1.5 ${remaining > 0 ? 'text-text-muted' : 'text-danger'}`}>
            {remaining > 0
              ? `오늘 AI 사용 가능: ${remaining}회 남음`
              : '오늘의 AI 사용 횟수를 모두 소진했습니다'}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={t('coach.placeholder')}
            className="flex-1 bg-surface-light border border-surface-border rounded-lg px-4 py-2.5 text-sm
              placeholder:text-text-muted/40 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-colors"
            disabled={streaming || !checkCanUse()}
          />
          <Button onClick={handleSend} disabled={streaming || !input.trim() || !checkCanUse()}>
            {streaming ? '...' : '전송'}
          </Button>
        </div>
      </div>
    </div>
  )
}
