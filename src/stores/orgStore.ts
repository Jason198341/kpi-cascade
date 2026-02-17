import { create } from 'zustand'
import { supabase, isDemoMode } from '@/lib/supabase'
import { DEMO_MEMBERS } from '@/data/seed'
import type { Organization, Profile } from '@/types'

interface OrgState {
  org: Organization | null
  members: Profile[]
  loading: boolean
  fetchOrg: (orgId: string) => Promise<void>
  createOrg: (name: string, userId: string) => Promise<Organization>
  fetchMembers: () => Promise<void>
  addMember: (member: Omit<Profile, 'id' | 'created_at'>) => Promise<void>
  updateMember: (id: string, updates: Partial<Profile>) => Promise<void>
  removeMember: (id: string) => Promise<void>
}

const DEMO_ORG: Organization = {
  id: 'demo-org-id',
  name: '캐스케이드 Inc.',
  slug: 'cascade-inc',
  owner_id: 'demo-user',
  created_at: new Date().toISOString(),
}

export const useOrgStore = create<OrgState>((set, get) => ({
  org: null,
  members: [],
  loading: false,

  fetchOrg: async (orgId) => {
    if (isDemoMode) { set({ org: DEMO_ORG }); return }
    set({ loading: true })
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()
    set({ org: data as Organization | null, loading: false })
  },

  createOrg: async (name, userId) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
    const { data, error } = await supabase
      .from('organizations')
      .insert({ name, slug, owner_id: userId })
      .select()
      .single()
    if (error) throw error
    const org = data as Organization
    set({ org })
    await supabase.from('profiles').update({ org_id: org.id, role: 'executive' }).eq('id', userId)
    return org
  },

  fetchMembers: async () => {
    const org = get().org
    if (!org) return
    if (isDemoMode) { set({ members: DEMO_MEMBERS }); return }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('org_id', org.id)
    set({ members: (data || []) as Profile[] })
  },

  addMember: async (member) => {
    const org = get().org
    if (!org) return
    if (isDemoMode) {
      const newMember: Profile = { ...member, id: crypto.randomUUID(), created_at: new Date().toISOString() }
      set({ members: [...get().members, newMember] })
      return
    }
    // Insert into profiles table (virtual member — no auth user)
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: crypto.randomUUID(),
        email: member.email,
        name: member.display_name,
        display_name: member.display_name,
        avatar_url: null,
        role: member.role,
        org_id: org.id,
        department: member.department,
      })
      .select()
      .single()
    if (error) throw error
    set({ members: [...get().members, data as Profile] })
  },

  updateMember: async (id, updates) => {
    if (!isDemoMode) {
      const { error } = await supabase.from('profiles').update(updates).eq('id', id)
      if (error) throw error
    }
    set({ members: get().members.map((m) => m.id === id ? { ...m, ...updates } : m) })
  },

  removeMember: async (id) => {
    if (!isDemoMode) {
      // Remove org link (don't delete profile entirely — they might still have auth)
      await supabase.from('profiles').update({ org_id: null }).eq('id', id)
    }
    set({ members: get().members.filter((m) => m.id !== id) })
  },
}))
