import { create } from 'zustand'
import { streamChat } from '@/lib/fireworks'
import { buildCoachMessages } from '@/data/prompts/coach-system'
import { useAuthStore } from './authStore'
import type { ChatMessage, CoachMode } from '@/types/ai'

const UNLIMITED_EMAILS = ['kcmmer1@naver.com', 'skypeople41@gmail.com']
const DAILY_AI_LIMIT = 1

function getTodayKey() {
  return `kc_ai_usage_${new Date().toISOString().slice(0, 10)}`
}

function getDailyUsage(): number {
  return parseInt(localStorage.getItem(getTodayKey()) || '0', 10)
}

function incrementUsage() {
  const key = getTodayKey()
  localStorage.setItem(key, String(getDailyUsage() + 1))
}

function canUseAI(): boolean {
  const email = useAuthStore.getState().profile?.email || useAuthStore.getState().user?.email || ''
  if (UNLIMITED_EMAILS.includes(email)) return true
  return getDailyUsage() < DAILY_AI_LIMIT
}

function getRemainingUses(): number {
  const email = useAuthStore.getState().profile?.email || useAuthStore.getState().user?.email || ''
  if (UNLIMITED_EMAILS.includes(email)) return Infinity
  return Math.max(0, DAILY_AI_LIMIT - getDailyUsage())
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
        content: '오늘의 AI 사용 횟수(1회)를 모두 소진했습니다. 내일 다시 이용해 주세요.',
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
      incrementUsage()
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
