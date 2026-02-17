import { create } from 'zustand'
import { supabase, isDemoMode } from '@/lib/supabase'
import type { Organization, Profile } from '@/types'

interface OrgState {
  org: Organization | null
  members: Profile[]
  loading: boolean
  fetchOrg: (orgId: string) => Promise<void>
  createOrg: (name: string, userId: string) => Promise<Organization>
  fetchMembers: () => Promise<void>
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
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const { data, error } = await supabase
      .from('organizations')
      .insert({ name, slug, owner_id: userId })
      .select()
      .single()
    if (error) throw error
    const org = data as Organization
    set({ org })
    // Link user profile to org
    await supabase.from('profiles').update({ org_id: org.id, role: 'executive' }).eq('id', userId)
    return org
  },

  fetchMembers: async () => {
    const org = get().org
    if (!org) return
    if (isDemoMode) { set({ members: [] }); return }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('org_id', org.id)
    set({ members: (data || []) as Profile[] })
  },
}))
