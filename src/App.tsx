import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useInitialize } from '@/hooks/useAuth'
import { AppShell } from '@/components/layout/AppShell'
import { AuthPage } from '@/pages/AuthPage'

const CascadePage = lazy(() => import('@/pages/CascadePage'))
const MyActionsPage = lazy(() => import('@/pages/MyActionsPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const PeoplePage = lazy(() => import('@/pages/PeoplePage'))
const TracePage = lazy(() => import('@/pages/TracePage'))
const CoachPage = lazy(() => import('@/pages/CoachPage'))
const ReportPage = lazy(() => import('@/pages/ReportPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const LandingPage = lazy(() => import('@/pages/LandingPage'))

function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-bg">
      <div className="text-center">
        <span className="text-4xl animate-pulse">🎯</span>
        <p className="text-text-muted mt-3 text-sm">Loading...</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { initialized, isLoggedIn } = useInitialize()

  if (!initialized) return <Loading />

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={isLoggedIn ? <Navigate to="/cascade" /> : <LandingPage />} />
        <Route path="/auth" element={isLoggedIn ? <Navigate to="/cascade" /> : <AuthPage />} />
        <Route element={isLoggedIn ? <AppShell /> : <Navigate to="/auth" />}>
          <Route path="/cascade" element={<CascadePage />} />
          <Route path="/cascade/:nodeId" element={<CascadePage />} />
          <Route path="/my-actions" element={<MyActionsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/people/:userId" element={<PeoplePage />} />
          <Route path="/trace/:nodeId" element={<TracePage />} />
          <Route path="/coach" element={<CoachPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
