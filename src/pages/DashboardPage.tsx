import { Header } from '@/components/layout/Header'
import { StrategicOverview } from '@/components/dashboard/StrategicOverview'
import { ContributionPipeline } from '@/components/dashboard/ContributionPipeline'
import { TopContributors } from '@/components/dashboard/TopContributors'
import { HealthScore } from '@/components/dashboard/HealthScore'
import { AtRiskList } from '@/components/dashboard/AtRiskList'
import { useUIStore } from '@/stores/uiStore'
import { useCascadeStore } from '@/stores/cascadeStore'
import { useOrgStore } from '@/stores/orgStore'
import { generatePDF } from '@/lib/exportPdf'
import { generateEmailText } from '@/lib/exportEmail'

export default function DashboardPage() {
  const t = useUIStore((s) => s.t)
  const lang = useUIStore((s) => s.lang)
  const toast = useUIStore((s) => s.toast)
  const { nodes, nodeMap, childrenMap } = useCascadeStore()
  const { org, members } = useOrgStore()

  const handlePDF = async () => {
    await generatePDF(nodes, nodeMap, childrenMap, members, org?.name || 'KPI Cascade', lang)
  }

  const handleEmail = async () => {
    const text = generateEmailText(nodes, nodeMap, childrenMap, members, org?.name || 'KPI Cascade', lang)
    try {
      await navigator.clipboard.writeText(text)
      toast(t('export.copied'), 'success')
    } catch {
      // Fallback for non-secure contexts
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      toast(t('export.copied'), 'success')
    }
  }

  const exportActions = (
    <div className="flex gap-1.5">
      <button
        onClick={handlePDF}
        className="text-xs font-medium px-2.5 py-1 rounded-md border border-surface-border hover:border-depth-0/50 hover:text-depth-0 text-text-muted cursor-pointer transition-colors"
        title={t('export.pdfButton')}
      >
        PDF
      </button>
      <button
        onClick={handleEmail}
        className="text-xs font-medium px-2.5 py-1 rounded-md border border-surface-border hover:border-depth-1/50 hover:text-depth-1 text-text-muted cursor-pointer transition-colors"
        title={t('export.emailButton')}
      >
        Email
      </button>
    </div>
  )

  return (
    <>
      <Header title={t('nav.dashboard')} actions={exportActions} />
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
