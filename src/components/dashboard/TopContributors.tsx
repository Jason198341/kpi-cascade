import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useCascadeStore } from '@/stores/cascadeStore'
import { useOrgStore } from '@/stores/orgStore'
import { useUIStore } from '@/stores/uiStore'
import { getContributionTrace, getEffectiveProgress } from '@/lib/cascade'
import type { KpiNode } from '@/types'

interface ContribEntry {
  action: KpiNode
  kpi: KpiNode
  goal: KpiNode
  progress: number
  cumulativeWeight: number
  actualContrib: number
  ownerName: string
  ownerDept: string | null
}

/**
 * Top contributing action plans — ranked by actual contribution to strategic goals.
 * Shows the full trace chain: Goal → KPI → Action with multiplication visible.
 */
export function TopContributors() {
  const nodes = useCascadeStore((s) => s.nodes)
  const nodeMap = useCascadeStore((s) => s.nodeMap)
  const childrenMap = useCascadeStore((s) => s.childrenMap)
  const getProgress = useCascadeStore((s) => s.getProgress)
  const members = useOrgStore((s) => s.members)
  const t = useUIStore((s) => s.t)

  const entries = useMemo(() => {
    const memberMap: Record<string, { name: string; dept: string | null }> = {}
    for (const p of members) memberMap[p.id] = { name: p.display_name, dept: p.department }

    const results: ContribEntry[] = []

    // Walk all depth-2 nodes
    for (const action of nodes.filter((n) => n.depth === 2)) {
      const kpi = action.parent_id ? nodeMap[action.parent_id] : null
      if (!kpi) continue
      const goal = kpi.parent_id ? nodeMap[kpi.parent_id] : null
      if (!goal) continue

      const progress = getProgress(action.id)
      const cumulativeWeight = kpi.weight * action.weight
      const actualContrib = cumulativeWeight * progress / 100
      const owner = action.owner_id ? memberMap[action.owner_id] : null

      results.push({
        action,
        kpi,
        goal,
        progress,
        cumulativeWeight,
        actualContrib,
        ownerName: owner?.name || t('node.unassigned'),
        ownerDept: owner?.dept || null,
      })
    }

    return results.sort((a, b) => b.actualContrib - a.actualContrib).slice(0, 8)
  }, [nodes, nodeMap, childrenMap, getProgress, members])

  if (entries.length === 0) return null

  const maxContrib = entries[0]?.actualContrib || 1

  return (
    <div className="glass rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-text">{t('dashboard.topContribActions')}</h3>
        <p className="text-xs text-text-muted mt-0.5">
          {t('dashboard.topContribDesc')}
        </p>
      </div>

      <div className="space-y-1.5">
        {entries.map((e, i) => {
          const barWidth = maxContrib > 0 ? (e.actualContrib / maxContrib) * 100 : 0
          const progressColor = e.progress >= 70 ? 'var(--color-success)' : e.progress >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'

          return (
            <motion.div
              key={e.action.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="relative flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-surface-light/50 transition-colors group"
            >
              {/* Rank */}
              <span className="text-xs font-bold text-text-muted w-5 text-right shrink-0">
                {i + 1}
              </span>

              {/* Owner avatar */}
              <div className="w-7 h-7 rounded-full bg-depth-2/20 text-depth-2 flex items-center justify-center text-[10px] font-bold shrink-0">
                {e.ownerName[0]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{e.action.emoji}</span>
                  <span className="text-xs font-medium truncate">{e.action.title}</span>
                </div>

                {/* Trace path */}
                <div className="flex items-center gap-1 mt-0.5 text-[9px] text-text-muted">
                  <span style={{ color: 'var(--color-depth-0)' }}>{e.goal.emoji}{e.goal.title.slice(0, 8)}</span>
                  <span>›</span>
                  <span style={{ color: 'var(--color-depth-1)' }}>{e.kpi.emoji}{e.kpi.title.slice(0, 8)}</span>
                  <span>›</span>
                  <span style={{ color: 'var(--color-depth-2)' }}>{e.ownerName}</span>
                  {e.ownerDept && <span className="text-text-muted/60">· {e.ownerDept}</span>}
                </div>

                {/* Contribution bar */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-surface-border/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'var(--color-trace)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
                    />
                  </div>
                </div>
              </div>

              {/* Right side: numbers */}
              <div className="text-right shrink-0 min-w-[110px]">
                {/* Weight formula */}
                <div className="text-[9px] font-mono text-text-muted">
                  <span style={{ color: 'var(--color-depth-1)' }}>×{e.kpi.weight.toFixed(2)}</span>
                  {' × '}
                  <span style={{ color: 'var(--color-depth-2)' }}>×{e.action.weight.toFixed(2)}</span>
                  {' = '}
                  <span style={{ color: 'var(--color-trace)' }}>{(e.cumulativeWeight * 100).toFixed(1)}%</span>
                </div>

                {/* Progress + actual contrib */}
                <div className="flex items-center justify-end gap-2 mt-0.5">
                  <span className="text-[10px] font-mono" style={{ color: progressColor }}>
                    {t('trace.progressLabel')} {Math.round(e.progress)}%
                  </span>
                  <span
                    className="text-xs font-bold font-mono px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(251, 191, 36, 0.12)', color: 'var(--color-trace)' }}
                  >
                    {(e.actualContrib * 100).toFixed(1)}%p
                  </span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
