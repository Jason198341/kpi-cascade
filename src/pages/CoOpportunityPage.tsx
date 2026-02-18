import { useMemo } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { getOpportunities } from '@/lib/co-utils'

export default function CoOpportunityPage() {
  const t = useUIStore((s) => s.t)
  const opportunities = useMemo(() => getOpportunities(), [])

  const highItems = opportunities.filter(o => o.coPossibility === 'high')
  const medItems = opportunities.filter(o => o.coPossibility === 'medium')
  const totalSavings = opportunities.reduce((s, o) => s + o.additionalCostUsd, 0)

  const rl = (cat: string) => t(`co.reason.${cat}`)

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <h2 className="text-lg font-bold mb-2">{t('co.opportunity.title')}</h2>
      <p className="text-sm text-text-muted mb-6">{t('co.opportunity.sub')}</p>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface rounded-xl border border-surface-border p-4">
          <p className="text-xs text-text-muted">{t('co.opportunity.itemCount')}</p>
          <p className="text-2xl font-bold mt-1">{opportunities.length}<span className="text-sm font-normal text-text-muted ml-1">{t('common.count')}</span></p>
        </div>
        <div className="bg-surface rounded-xl border border-surface-border p-4">
          <p className="text-xs text-text-muted">{t('co.opportunity.potentialSavings')}</p>
          <p className="text-2xl font-bold mt-1 text-emerald-400">${totalSavings.toLocaleString()}</p>
        </div>
        <div className="bg-surface rounded-xl border border-surface-border p-4">
          <p className="text-xs text-text-muted">{t('co.opportunity.high')} / {t('co.opportunity.medium')}</p>
          <p className="text-2xl font-bold mt-1">
            <span className="text-emerald-400">{highItems.length}</span>
            <span className="text-text-muted mx-1">/</span>
            <span className="text-amber-400">{medItems.length}</span>
          </p>
        </div>
      </div>

      {/* High possibility */}
      {highItems.length > 0 && (
        <section className="mb-8">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {t('co.opportunity.high')} ({highItems.length})
          </h3>
          <div className="grid gap-3">
            {highItems.map(item => <OpportunityCard key={item.partNo} item={item} rl={rl} t={t} />)}
          </div>
        </section>
      )}

      {/* Medium possibility */}
      {medItems.length > 0 && (
        <section>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            {t('co.opportunity.medium')} ({medItems.length})
          </h3>
          <div className="grid gap-3">
            {medItems.map(item => <OpportunityCard key={item.partNo} item={item} rl={rl} t={t} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function OpportunityCard({ item, rl, t }: {
  item: ReturnType<typeof getOpportunities>[0]
  rl: (k: string) => string
  t: (k: string) => string
}) {
  const possColor = item.coPossibility === 'high' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'
  const possBadge = item.coPossibility === 'high'
    ? 'bg-emerald-500/15 text-emerald-400'
    : 'bg-amber-500/15 text-amber-400'

  return (
    <div className={`rounded-xl border p-4 ${possColor}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-medium text-sm">{item.partName}</div>
          <div className="text-xs text-text-muted mt-0.5">
            {item.vehicleCode} / {item.systemName} / <span className="font-mono">{item.partNo}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${possBadge}`}>
            {t(`co.opportunity.${item.coPossibility}`)}
          </span>
          <span className="text-sm font-bold text-emerald-400">${item.additionalCostUsd}</span>
        </div>
      </div>
      <div className="text-xs text-text-muted mb-1">
        <span className="font-medium text-text">{rl(item.categoryCode)}</span>
        <span className="mx-1.5">—</span>
        {item.diffDescription}
      </div>
      {item.coCondition && (
        <div className="text-xs mt-2 bg-surface/50 rounded-lg px-3 py-2">
          <span className="font-medium">{t('co.opportunity.condition')}:</span> {item.coCondition}
        </div>
      )}
      <div className="text-[10px] text-text-muted mt-2">
        {t('co.projects.supplier')}: {item.supplier}
      </div>
    </div>
  )
}
