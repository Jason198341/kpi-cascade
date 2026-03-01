import { create } from 'zustand'
import { streamChat } from '@/lib/fireworks'
import { buildCoachMessages } from '@/data/prompts/coach-system'
import { checkDailyLimit, incrementDailyCount, RATE_LIMIT_ERROR_MESSAGE } from '@/lib/rate-limiter'
import type { ChatMessage, CoachMode } from '@/types/ai'

const FEATURE_KEY = 'coach'

function canUseAI(): boolean {
  return checkDailyLimit(FEATURE_KEY).allowed
}

function getRemainingUses(): number {
  return checkDailyLimit(FEATURE_KEY).remaining
}

interface CoachState {
  messages: ChatMessage[]
  mode: CoachMode
  contextNodeId: string | null
  streaming: boolean
  setMode: (mode: CoachMode) => void
  setContextNode: (id: string | null) => void
  sendMessage: (content: string, kpiContext?: string) => Promise<void>
  clearMessages: () => void
  canUseAI: () => boolean
  getRemainingUses: () => number
}

export const useCoachStore = create<CoachState>((set, get) => ({
  messages: [],
  mode: 'analyze',
  contextNodeId: null,
  streaming: false,

  setMode: (mode) => set({ mode }),
  setContextNode: (id) => set({ contextNodeId: id }),

  canUseAI,
  getRemainingUses,

  sendMessage: async (content, kpiContext) => {
    // Rate limit check
    if (!canUseAI()) {
      const limitMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: RATE_LIMIT_ERROR_MESSAGE,
        timestamp: Date.now(),
      }
      set((s) => ({ messages: [...s.messages, { id: crypto.randomUUID(), role: 'user', content, timestamp: Date.now() }, limitMsg] }))
      return
    }

    const { mode, messages } = get()
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }

    set({ messages: [...messages, userMsg, assistantMsg], streaming: true })

    const apiMessages = buildCoachMessages(mode, content, kpiContext)
    // Add previous conversation for context
    const prev = messages.filter((m) => m.role !== 'system').slice(-10)
    for (const m of prev) {
      apiMessages.push({ role: m.role as 'user' | 'assistant', content: m.content })
    }
    apiMessages.push({ role: 'user', content })

    try {
      let accumulated = ''
      for await (const chunk of streamChat(apiMessages)) {
        accumulated += chunk
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: accumulated } : m,
          ),
        }))
      }
      // Count this usage
      incrementDailyCount(FEATURE_KEY)
    } catch (err) {
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: m.content || `오류가 발생했습니다: ${err}` }
            : m,
        ),
      }))
    } finally {
      set({ streaming: false })
    }
  },

  clearMessages: () => set({ messages: [] }),
}))
