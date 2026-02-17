import { create } from 'zustand'
import ko from '@/data/i18n/ko.json'
import en from '@/data/i18n/en.json'

type Lang = 'ko' | 'en'
const dictionaries: Record<Lang, Record<string, string>> = { ko, en }

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface UIState {
  lang: Lang
  sidebarOpen: boolean
  toasts: Toast[]
  setLang: (l: Lang) => void
  toggleSidebar: () => void
  setSidebarOpen: (v: boolean) => void
  t: (key: string) => string
  toast: (message: string, type?: Toast['type']) => void
  dismissToast: (id: string) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  lang: (navigator.language.startsWith('ko') ? 'ko' : 'en') as Lang,
  sidebarOpen: true,
  toasts: [],
  setLang: (lang) => set({ lang }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  t: (key) => dictionaries[get().lang][key] || key,
  toast: (message, type = 'info') => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => get().dismissToast(id), 4000)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
