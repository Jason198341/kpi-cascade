import { Header } from '@/components/layout/Header'
import { StrategicOverview } from '@/components/dashboard/StrategicOverview'
import { ContributionPipeline } from '@/components/dashboard/ContributionPipeline'
import { TopContributors } from '@/components/dashboard/TopContributors'
import { HealthScore } from '@/components/dashboard/HealthScore'
import { AtRiskList } from '@/components/dashboard/AtRiskList'
import { useUIStore } from '@/stores/uiStore'

export default function DashboardPage() {
  const t = useUIStore((s) => s.t)

  return (
    <>
      <Header title={t('nav.dashboard')} />
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Row 1: Strategic Goals Weight Distribution — full width */}
          <div className="lg:col-span-12">
            <StrategicOverview />
          </div>

          {/* Row 2: Pipeline (8col) + Health/Risk (4col) */}
          <div className="lg:col-span-8">
            <ContributionPipeline />
          </div>
          <div className="lg:col-span-4 flex flex-col gap-4">
            <HealthScore />
            <AtRiskList />
          </div>

          {/* Row 3: Top Contributors — full width */}
          <div className="lg:col-span-12">
            <TopContributors />
          </div>
        </div>
      </div>
    </>
  )
}
