import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useInitialize } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { AppShell } from '@/components/layout/AppShell'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { ThemeInit } from '@/components/common/ThemeInit'
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

// Commonization pages
const CoDashboardPage = lazy(() => import('@/pages/CoDashboardPage'))
const CoProjectsPage = lazy(() => import('@/pages/CoProjectsPage'))
const CoAnalyticsPage = lazy(() => import('@/pages/CoAnalyticsPage'))
const CoOpportunityPage = lazy(() => import('@/pages/CoOpportunityPage'))

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
  const profile = useAuthStore((s) => s.profile)

  if (!initialized) return <Loading />

  // User is logged in but profile hasn't loaded yet — wait
  if (isLoggedIn && !profile) return <Loading />

  // Show onboarding wizard for logged-in users who haven't completed it
  if (isLoggedIn && profile && !profile.onboarding_completed) {
    return <OnboardingWizard />
  }

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
          {/* Commonization routes */}
          <Route path="/co/dashboard" element={<CoDashboardPage />} />
          <Route path="/co/projects" element={<CoProjectsPage />} />
          <Route path="/co/analytics" element={<CoAnalyticsPage />} />
          <Route path="/co/opportunity" element={<CoOpportunityPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeInit />
      <AppRoutes />
    </BrowserRouter>
  )
}
