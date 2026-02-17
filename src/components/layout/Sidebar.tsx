import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'

const NAV_ITEMS = [
  { path: '/cascade', icon: '🔗', labelKey: 'nav.cascade' },
  { path: '/my-actions', icon: '⚡', labelKey: 'nav.myActions' },
  { path: '/dashboard', icon: '📊', labelKey: 'nav.dashboard' },
  { path: '/people', icon: '👥', labelKey: 'nav.people' },
  { path: '/coach', icon: '🤖', labelKey: 'nav.coach' },
  { path: '/report', icon: '📝', labelKey: 'nav.report' },
  { path: '/settings', icon: '⚙️', labelKey: 'nav.settings' },
]

export function Sidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const t = useUIStore((s) => s.t)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const profile = useAuthStore((s) => s.profile)
  const signOut = useAuthStore((s) => s.signOut)

  const handleNav = (path: string) => {
    navigate(path)
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) setSidebarOpen(false)
  }

  return (
    <motion.aside
      className={`h-screen bg-surface/95 backdrop-blur-sm border-r border-surface-border flex flex-col shrink-0 overflow-hidden
        fixed md:relative z-50 md:z-auto`}
      animate={{ width: sidebarOpen ? 220 : 0 }}
      transition={{ duration: 0.2 }}
      style={{ pointerEvents: sidebarOpen ? 'auto' : 'none' }}
    >
      <div style={{ width: 220, minWidth: 220 }} className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 shrink-0">
          <span className="text-xl">🎯</span>
          <span className="font-semibold text-sm tracking-tight text-text">KPI Cascade</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 flex flex-col gap-px px-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.path)
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-100 cursor-pointer
                  ${active
                    ? 'bg-surface-light text-text font-medium'
                    : 'text-text-muted hover:text-text hover:bg-surface-light/50'
                  }`}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
                <span>{t(item.labelKey)}</span>
              </button>
            )
          })}
        </nav>

        {/* User */}
        <div className="border-t border-surface-border p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">
              {(profile?.display_name || '?')[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{profile?.display_name}</div>
              <button
                onClick={signOut}
                className="text-[11px] text-text-muted hover:text-danger transition-colors cursor-pointer"
              >
                {t('auth.signOut')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  )
}
