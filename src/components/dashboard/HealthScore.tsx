import { motion } from 'framer-motion'
import { useCascadeStore } from '@/stores/cascadeStore'

export function HealthScore() {
  const nodes = useCascadeStore((s) => s.nodes)
  const getProgress = useCascadeStore((s) => s.getProgress)

  // Health = avg progress of depth-0 nodes
  const roots = nodes.filter((n) => n.depth === 0)
  const avgProgress = roots.length > 0
    ? roots.reduce((sum, n) => sum + getProgress(n.id), 0) / roots.length
    : 0

  const atRiskCount = nodes.filter((n) => n.status === 'at_risk').length
  const completedCount = nodes.filter((n) => n.status === 'completed').length

  const healthColor = avgProgress >= 70 ? 'var(--color-success)' :
    avgProgress >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'

  const r = 70
  const circ = 2 * Math.PI * r
  const offset = circ - (avgProgress / 100) * circ

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-sm font-medium text-text-muted mb-4">조직 건강도</h3>
      <div className="flex items-center gap-6">
        <div className="relative">
          <svg width={160} height={160} className="-rotate-90">
            <circle cx={80} cy={80} r={r} fill="none" stroke="var(--color-surface-border)" strokeWidth={8} />
            <motion.circle
              cx={80} cy={80} r={r}
              fill="none" stroke={healthColor} strokeWidth={8}
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold font-mono" style={{ color: healthColor }}>
              {Math.round(avgProgress)}
            </span>
            <span className="text-xs text-text-muted">/ 100</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-xs text-text-muted">전략 목표</div>
            <div className="text-lg font-semibold">{roots.length}개</div>
          </div>
          <div>
            <div className="text-xs text-text-muted">위험 항목</div>
            <div className="text-lg font-semibold text-warning">{atRiskCount}개</div>
          </div>
          <div>
            <div className="text-xs text-text-muted">완료</div>
            <div className="text-lg font-semibold text-success">{completedCount}개</div>
          </div>
        </div>
      </div>
    </div>
  )
}
