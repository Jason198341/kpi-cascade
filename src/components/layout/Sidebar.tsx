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
  { path: '/settings', icon: '⚙️', labelKey: 'nav.settings' },
]

export function Sidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const t = useUIStore((s) => s.t)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const profile = useAuthStore((s) => s.profile)
  const signOut = useAuthStore((s) => s.signOut)

  return (
    <motion.aside
      className="h-screen bg-surface border-r border-surface-border flex flex-col shrink-0 overflow-hidden"
      animate={{ width: sidebarOpen ? 220 : 64 }}
      transition={{ duration: 0.2 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-border">
        <span className="text-2xl">🎯</span>
        {sidebarOpen && <span className="font-bold text-lg tracking-tight">KPI Cascade</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer
                ${active
                  ? 'bg-primary/8 text-primary font-medium'
                  : 'text-text-muted hover:text-text hover:bg-surface-light'
                }`}
            >
              {/* Active accent bar */}
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="text-lg w-6 text-center shrink-0">{item.icon}</span>
              {sidebarOpen && <span>{t(item.labelKey)}</span>}
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-surface-border p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0 ring-2 ring-primary/10">
            {(profile?.display_name || '?')[0]}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{profile?.display_name}</div>
              <button
                onClick={signOut}
                className="text-xs text-text-muted hover:text-danger transition-colors cursor-pointer"
              >
                {t('auth.signOut')}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
