import { create } from 'zustand'
import { supabase, isDemoMode } from '@/lib/supabase'
import type { Profile } from '@/types'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  fetchProfile: (userId: string) => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const DEMO_USER: User = {
  id: 'demo-user',
  email: 'demo@kpicascade.com',
  app_metadata: {},
  user_metadata: { display_name: '김대표' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User

const DEMO_PROFILE: Profile = {
  id: 'demo-user',
  email: 'demo@kpicascade.com',
  display_name: '김대표',
  avatar_url: null,
  role: 'executive',
  org_id: 'demo-org-id',
  department: '경영',
  hire_year: 2010,
  position_title: '상무',
  onboarding_completed: true,
  created_at: new Date().toISOString(),
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    if (isDemoMode) {
      set({ user: DEMO_USER, profile: DEMO_PROFILE, initialized: true })
      return
    }
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      set({ user: session.user })
      await get().fetchProfile(session.user.id)
    }
    set({ initialized: true })

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        set({ user: session.user })
        await get().fetchProfile(session.user.id)
      } else {
        set({ user: null, profile: null })
      }
    })
  },

  signIn: async (email, password) => {
    set({ loading: true })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    set({ loading: false })
    if (error) throw error
  },

  signUp: async (email, password, name) => {
    set({ loading: true })
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: name } },
    })
    set({ loading: false })
    if (error) throw error
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) set({ profile: data as Profile })
  },

  updateProfile: async (updates) => {
    const { profile } = get()
    if (!profile) return
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)
    if (!error) set({ profile: { ...profile, ...updates } })
  },
}))
