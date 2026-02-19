import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCascadeStore } from '@/stores/cascadeStore'
import { useOrgStore } from '@/stores/orgStore'
import { useUIStore } from '@/stores/uiStore'
import type { KpiNode } from '@/types'

/**
 * Visual weight multiplication pipeline:
 * Shows depth-0 → depth-1 → depth-2 tree with weight chain at each level.
 * Leaf nodes display full formula: "0.35 × 0.40 × 0.35 = 4.9%"
 */
export function ContributionPipeline() {
  const nodes = useCascadeStore((s) => s.nodes)
  const nodeMap = useCascadeStore((s) => s.nodeMap)
  const childrenMap = useCascadeStore((s) => s.childrenMap)
  const getProgress = useCascadeStore((s) => s.getProgress)
  const members = useOrgStore((s) => s.members)
  const t = useUIStore((s) => s.t)

  const goals = useMemo(
    () => nodes.filter((n) => n.depth === 0).sort((a, b) => a.sort_order - b.sort_order),
    [nodes],
  )

  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)

  // Auto-select first goal
  const activeGoalId = selectedGoal || goals[0]?.id || null
  const activeGoal = activeGoalId ? nodeMap[activeGoalId] : null

  const memberMap = useMemo(() => {
    const m: Record<string, { name: string; dept: string | null }> = {}
    for (const p of members) m[p.id] = { name: p.display_name, dept: p.department }
    return m
  }, [members])

  if (!activeGoal) return null

  const kpis = (childrenMap[activeGoal.id] || []).map((id) => nodeMap[id]).filter(Boolean) as KpiNode[]

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-sm font-semibold text-text">{t('dashboard.contribPipeline')}</h3>
          <p className="text-xs text-text-muted mt-0.5">{t('dashboard.contribPipelineDesc')}</p>
        </div>
      </div>

      {/* Goal selector tabs */}
      <div className="flex gap-1.5 mt-3 mb-4 overflow-x-auto">
        {goals.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGoal(g.id)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer
              ${g.id === activeGoalId
                ? 'bg-depth-0/20 text-depth-0 border border-depth-0/40'
                : 'bg-surface-light text-text-muted hover:text-text border border-transparent'
              }`}
          >
            {g.emoji} {g.title.slice(0, 12)}
          </button>
        ))}
      </div>

      {/* Pipeline tree */}
      <div className="space-y-0">
        {/* Root node (depth-0) */}
        <PipelineRow
          emoji={activeGoal.emoji}
          title={activeGoal.title}
          weight={activeGoal.weight}
          progress={getProgress(activeGoal.id)}
          depth={0}
          cumulativeWeight={1}
          showFormula={false}
        />

        {/* Depth-1 KPIs */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeGoalId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {kpis.map((kpi, ki) => {
              const kpiProgress = getProgress(kpi.id)
              const actions = (childrenMap[kpi.id] || []).map((id) => nodeMap[id]).filter(Boolean) as KpiNode[]
              const isLast = ki === kpis.length - 1

              return (
                <div key={kpi.id}>
                  <PipelineRow
                    emoji={kpi.emoji}
                    title={kpi.title}
                    weight={kpi.weight}
                    progress={kpiProgress}
                    depth={1}
                    cumulativeWeight={kpi.weight}
                    showFormula={false}
                    isLast={isLast && actions.length === 0}
                  />

                  {/* Depth-2 Actions + milestones */}
                  {actions.map((action, ai) => {
                    const actionProgress = getProgress(action.id)
                    const cumulativeWeight = kpi.weight * action.weight
                    const actualContrib = cumulativeWeight * actionProgress / 100
                    const owner = action.owner_id ? memberMap[action.owner_id] : null
                    const isLastAction = ai === actions.length - 1
                    const ms = action.milestones

                    return (
                      <div key={action.id}>
                        <PipelineRow
                          emoji={action.emoji}
                          title={action.title}
                          weight={action.weight}
                          progress={actionProgress}
                          depth={2}
                          cumulativeWeight={cumulativeWeight}
                          showFormula
                          formulaParts={[kpi.weight, action.weight]}
                          actualContrib={actualContrib}
                          owner={owner}
                          isLast={isLast && isLastAction && (!ms || ms.length === 0)}
                        />
                        {/* Milestones under action */}
                        {ms && ms.length > 0 && (
                          <div className="ml-[84px] mb-1">
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                              {ms.map((m) => (
                                <span key={m.id} className={`text-[9px] ${m.done ? 'text-depth-2' : 'text-text-muted'}`}>
                                  {m.done ? '✓' : '○'} {m.label}
                                  {(m.start_date || m.end_date) && (
                                    <span className="text-text-muted/50 ml-0.5">
                                      ({m.start_date?.slice(5) || '?'}~{m.end_date?.slice(5) || '?'})
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-surface-border/50 flex flex-wrap gap-4 text-[10px] text-text-muted">
        <span>
          <b className="text-depth-0">●</b> {t('dashboard.weightDesc')}
        </span>
        <span>
          <b className="text-depth-2">█</b> {t('dashboard.progressDesc')}
        </span>
        <span>
          <b className="text-trace">★</b> {t('dashboard.contribDesc')}
        </span>
      </div>
    </div>
  )
}

/* ─── Pipeline Row ─── */

const depthColors = ['var(--color-depth-0)', 'var(--color-depth-1)', 'var(--color-depth-2)']
// depthLabels are now unused since we use i18n keys via PipelineRow
const depthLabels = ['dashboard.depthGoal', 'dashboard.depthKpi', 'dashboard.depthAction']

function PipelineRow({
  emoji,
  title,
  weight,
  progress,
  depth,
  cumulativeWeight,
  showFormula,
  formulaParts,
  actualContrib,
  owner,
  isLast,
}: {
  emoji: string
  title: string
  weight: number
  progress: number
  depth: number
  cumulativeWeight: number
  showFormula: boolean
  formulaParts?: number[]
  actualContrib?: number
  owner?: { name: string; dept: string | null } | null
  isLast?: boolean
}) {
  const color = depthColors[depth] || depthColors[2]
  const progressColor = progress >= 70 ? 'var(--color-success)' : progress >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'
  const indent = depth * 28

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: depth * 0.05 }}
      className="flex items-start gap-2 py-1.5 group"
      style={{ paddingLeft: indent }}
    >
      {/* Tree connector */}
      {depth > 0 && (
        <div className="flex items-center shrink-0 mt-2">
          <div className="w-4 h-px" style={{ background: color, opacity: 0.3 }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: color, opacity: 0.5 }} />
        </div>
      )}

      {/* Node content */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {/* Emoji */}
        <span className="text-sm shrink-0">{emoji}</span>

        {/* Info block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium truncate">{title}</span>
            <span
              className="text-[9px] font-mono font-bold px-1 py-0.5 rounded shrink-0"
              style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
            >
              ×{weight.toFixed(2)}
            </span>
            {depth === 2 && owner && (
              <span className="text-[9px] text-text-muted truncate shrink-0">
                {owner.name}{owner.dept ? ` · ${owner.dept}` : ''}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-surface-border rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: progressColor }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[10px] font-mono font-semibold shrink-0" style={{ color: progressColor }}>
              {Math.round(progress)}%
            </span>
          </div>

          {/* Cumulative contribution formula (depth-2 only) */}
          {showFormula && formulaParts && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[9px] text-text-muted">{useUIStore.getState().t('dashboard.cumulativeContrib')}:</span>
              <span className="text-[9px] font-mono text-text-muted">
                {formulaParts.map((p) => p.toFixed(2)).join(' × ')}
              </span>
              <span className="text-[9px] font-mono text-text-muted">=</span>
              <span
                className="text-[9px] font-mono font-bold px-1 py-0.5 rounded"
                style={{ background: 'rgba(251, 191, 36, 0.12)', color: 'var(--color-trace)' }}
              >
                {(cumulativeWeight * 100).toFixed(1)}%
              </span>
              {actualContrib !== undefined && (
                <>
                  <span className="text-[9px] text-text-muted ml-1">{useUIStore.getState().t('trace.actual')}:</span>
                  <span className="text-[9px] font-mono font-bold" style={{ color: 'var(--color-trace)' }}>
                    {(actualContrib * 100).toFixed(1)}%p
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
