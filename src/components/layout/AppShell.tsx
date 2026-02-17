import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { ToastContainer } from '@/components/common/Toast'

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden noise">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  )
}
