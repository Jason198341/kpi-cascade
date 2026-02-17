import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { ToastContainer } from '@/components/common/Toast'
import { useUIStore } from '@/stores/uiStore'

export function AppShell() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  )
}
