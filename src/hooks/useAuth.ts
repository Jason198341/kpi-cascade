import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useCascadeStore } from '@/stores/cascadeStore'
import { useOrgStore } from '@/stores/orgStore'
import { isDemoMode } from '@/lib/supabase'

export function useInitialize() {
  const initialize = useAuthStore((s) => s.initialize)
  const profile = useAuthStore((s) => s.profile)
  const fetchProfile = useAuthStore((s) => s.fetchProfile)
  const initialized = useAuthStore((s) => s.initialized)
  const fetchNodes = useCascadeStore((s) => s.fetchNodes)
  const fetchOrg = useOrgStore((s) => s.fetchOrg)
  const fetchMembers = useOrgStore((s) => s.fetchMembers)
  const createOrg = useOrgStore((s) => s.createOrg)
  const creatingOrg = useRef(false)

  useEffect(() => { initialize() }, [initialize])

  // Auto-create org for new users who don't have one
  useEffect(() => {
    if (!profile || profile.org_id || isDemoMode || creatingOrg.current) return
    creatingOrg.current = true
    const name = profile.display_name || profile.email.split('@')[0]
    createOrg(`${name}의 조직`, profile.id)
      .then(() => fetchProfile(profile.id))
      .finally(() => { creatingOrg.current = false })
  }, [profile, createOrg, fetchProfile])

  // Fetch org data + members + nodes once org_id is available
  useEffect(() => {
    if (!profile?.org_id) return
    fetchOrg(profile.org_id).then(() => fetchMembers())
    fetchNodes(profile.org_id)
  }, [profile?.org_id, fetchOrg, fetchMembers, fetchNodes])

  return { initialized, isLoggedIn: !!profile }
}
