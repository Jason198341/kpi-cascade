import { Header } from '@/components/layout/Header'
import { HealthScore } from '@/components/dashboard/HealthScore'
import { ProgressChart } from '@/components/dashboard/ProgressChart'
import { DepartmentBar } from '@/components/dashboard/DepartmentBar'
import { AtRiskList } from '@/components/dashboard/AtRiskList'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { useUIStore } from '@/stores/uiStore'

export default function DashboardPage() {
  const t = useUIStore((s) => s.t)

  return (
    <>
      <Header title={t('nav.dashboard')} />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
          <HealthScore />
          <AtRiskList />
          <ProgressChart />
          <DepartmentBar />
          <div className="lg:col-span-2">
            <ActivityFeed />
          </div>
        </div>
      </div>
    </>
  )
}
