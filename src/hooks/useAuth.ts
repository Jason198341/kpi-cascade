import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useCascadeStore } from '@/stores/cascadeStore'
import { useOrgStore } from '@/stores/orgStore'

export function useInitialize() {
  const initialize = useAuthStore((s) => s.initialize)
  const profile = useAuthStore((s) => s.profile)
  const initialized = useAuthStore((s) => s.initialized)
  const fetchNodes = useCascadeStore((s) => s.fetchNodes)
  const fetchOrg = useOrgStore((s) => s.fetchOrg)

  useEffect(() => { initialize() }, [initialize])

  useEffect(() => {
    if (!profile?.org_id) return
    fetchOrg(profile.org_id)
    fetchNodes(profile.org_id)
  }, [profile?.org_id, fetchOrg, fetchNodes])

  return { initialized, isLoggedIn: !!profile }
}
