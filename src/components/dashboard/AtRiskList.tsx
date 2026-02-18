import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCascadeStore } from '@/stores/cascadeStore'
import { useUIStore } from '@/stores/uiStore'
import { DepthTag } from '@/components/common/DepthTag'
import { isOverdue, daysUntil } from '@/lib/date'

export function AtRiskList() {
  const navigate = useNavigate()
  const nodes = useCascadeStore((s) => s.nodes)
  const getProgress = useCascadeStore((s) => s.getProgress)
  const t = useUIStore((s) => s.t)

  const atRisk = useMemo(() => {
    return nodes
      .filter((n) => {
        if (n.status === 'at_risk') return true
        if (n.status === 'completed' || n.status === 'paused') return false
        const prog = getProgress(n.id)
        const days = daysUntil(n.due_date)
        if (days !== null && days < 14 && prog < 50) return true
        if (isOverdue(n.due_date) && prog < 100) return true
        return false
      })
      .slice(0, 8)
  }, [nodes, getProgress])

  if (atRisk.length === 0) {
    return (
      <div className="glass rounded-xl p-6">
        <h3 className="text-sm font-medium text-text-muted mb-4">{t('dashboard.atRisk')}</h3>
        <div className="text-sm text-success flex items-center gap-2">✓ {t('dashboard.noAtRisk')}</div>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-sm font-medium text-text-muted mb-4">
        {t('dashboard.atRisk')} <span className="text-warning">({atRisk.length})</span>
      </h3>
      <div className="flex flex-col gap-2">
        {atRisk.map((n) => {
          const prog = getProgress(n.id)
          const days = daysUntil(n.due_date)
          return (
            <button
              key={n.id}
              onClick={() => navigate(`/cascade/${n.id}`)}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-light transition-colors text-left cursor-pointer"
            >
              <span className="text-lg">{n.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{n.title}</div>
                <DepthTag depth={n.depth} />
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-mono text-warning">{Math.round(prog)}%</div>
                {days !== null && (
                  <div className={`text-xs ${days < 0 ? 'text-danger' : 'text-warning'}`}>
                    {days < 0 ? `${-days}${t('dashboard.daysOverdue')}` : `D-${days}`}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
