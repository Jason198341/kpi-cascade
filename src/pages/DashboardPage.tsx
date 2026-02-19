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
// Lazy-loaded to keep main chunk small (~400KB exceljs)
const loadExcel = () => import('@/lib/exportExcel')

export default function DashboardPage() {
  const t = useUIStore((s) => s.t)
  const lang = useUIStore((s) => s.lang)
  const toast = useUIStore((s) => s.toast)
  const { nodes, nodeMap, childrenMap } = useCascadeStore()
  const { org, members } = useOrgStore()

  const orgName = org?.name || 'KPI Cascade'

  const handlePDF = async () => {
    await generatePDF(nodes, nodeMap, childrenMap, members, orgName)
  }

  const handleEmail = async () => {
    const text = generateEmailText(nodes, nodeMap, childrenMap, members, orgName)
    try {
      await navigator.clipboard.writeText(text)
      toast(t('export.copied'), 'success')
    } catch {
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

  const handleExcelActionPlan = async () => {
    const { generateExcel } = await loadExcel()
    await generateExcel(nodes, nodeMap, childrenMap, members, orgName, lang, 'actionplan')
  }

  const handleExcelGantt = async () => {
    const { generateExcel } = await loadExcel()
    await generateExcel(nodes, nodeMap, childrenMap, members, orgName, lang, 'gantt')
  }

  const btnClass =
    'text-xs font-medium px-2.5 py-1 rounded-md border border-surface-border hover:border-depth-0/50 hover:text-depth-0 text-text-muted cursor-pointer transition-colors'
  const btnClass2 =
    'text-xs font-medium px-2.5 py-1 rounded-md border border-surface-border hover:border-depth-1/50 hover:text-depth-1 text-text-muted cursor-pointer transition-colors'
  const btnClass3 =
    'text-xs font-medium px-2.5 py-1 rounded-md border border-surface-border hover:border-depth-2/50 hover:text-depth-2 text-text-muted cursor-pointer transition-colors'

  const exportActions = (
    <div className="flex gap-1.5 flex-wrap">
      <button onClick={handlePDF} className={btnClass} title={t('export.pdfButton')}>
        PDF
      </button>
      <button onClick={handleEmail} className={btnClass2} title={t('export.emailButton')}>
        Email
      </button>
      <button onClick={handleExcelActionPlan} className={btnClass3} title={t('export.excelAction')}>
        {t('export.excelActionShort')}
      </button>
      <button onClick={handleExcelGantt} className={btnClass} title={t('export.excelGantt')}>
        {t('export.excelGanttShort')}
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
