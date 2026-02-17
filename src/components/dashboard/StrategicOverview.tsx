import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useCascadeStore } from '@/stores/cascadeStore'
import type { KpiNode, Depth } from '@/types'

/** Row of depth-0 cards where width ∝ weight — makes weight concept instantly visual */
export function StrategicOverview() {
  const nodes = useCascadeStore((s) => s.nodes)
  const getProgress = useCascadeStore((s) => s.getProgress)
  const childrenMap = useCascadeStore((s) => s.childrenMap)
  const nodeMap = useCascadeStore((s) => s.nodeMap)

  const goals = useMemo(() => {
    return nodes
      .filter((n) => n.depth === 0)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((n) => {
        const progress = getProgress(n.id)
        const kpiCount = (childrenMap[n.id] || []).length
        const actionCount = (childrenMap[n.id] || []).reduce((sum, kidId) => {
          return sum + (childrenMap[kidId] || []).length
        }, 0)
        return { node: n, progress, kpiCount, actionCount }
      })
  }, [nodes, getProgress, childrenMap, nodeMap])

  const totalWeight = goals.reduce((s, g) => s + g.node.weight, 0)

  if (goals.length === 0) return null

  return (
    <div className="glass rounded-xl p-4 sm:p-5">
      {/* Header with legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-text">전략 목표 가중치 분포</h3>
          <p className="text-xs text-text-muted mt-0.5">카드 너비 = 가중치 비율. 넓을수록 중요도가 높습니다</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-muted shrink-0">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-success" /> 70%+
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-warning" /> 40-69%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-danger" /> &lt;40%
          </span>
        </div>
      </div>

      {/* Weight proportional cards — flex with basis proportional to weight */}
      <div className="flex flex-col sm:flex-row gap-2">
        {goals.map((g, i) => {
          const pct = totalWeight > 0 ? (g.node.weight / totalWeight) * 100 : 25
          const progress = Math.round(g.progress)
          const color = progress >= 70 ? 'var(--color-success)' : progress >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'

          // Mini ring
          const r = 22
          const circ = 2 * Math.PI * r
          const offset = circ - (g.progress / 100) * circ

          return (
            <motion.div
              key={g.node.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="relative rounded-lg bg-surface-light border border-surface-border overflow-hidden min-w-0"
              style={{ flex: `${pct} 0 0%` }}
            >
              {/* Weight fill bar at top */}
              <div
                className="h-1 w-full"
                style={{ background: `linear-gradient(90deg, var(--color-depth-0), ${color})` }}
              />

              <div className="p-3">
                {/* Weight badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg">{g.node.emoji}</span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(167, 139, 250, 0.15)', color: 'var(--color-depth-0)' }}
                  >
                    비중 {Math.round(pct)}%
                  </span>
                </div>

                {/* Title */}
                <div className="text-xs font-semibold truncate mb-3">{g.node.title}</div>

                {/* Ring + stats */}
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <svg width={52} height={52} className="-rotate-90">
                      <circle cx={26} cy={26} r={r} fill="none" stroke="var(--color-surface-border)" strokeWidth={4} />
                      <motion.circle
                        cx={26} cy={26} r={r}
                        fill="none" stroke={color} strokeWidth={4}
                        strokeDasharray={circ}
                        initial={{ strokeDashoffset: circ }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold font-mono" style={{ color }}>{progress}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5 text-[10px] text-text-muted min-w-0">
                    <span>KPI <b className="text-text">{g.kpiCount}</b>개</span>
                    <span>액션 <b className="text-text">{g.actionCount}</b>개</span>
                    <span>×{g.node.weight.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Weight sum check */}
      <div className="mt-2 text-center">
        <span className={`text-[10px] font-mono ${Math.abs(totalWeight - 1) < 0.01 ? 'text-success' : 'text-danger'}`}>
          Σ 가중치 = {totalWeight.toFixed(2)} {Math.abs(totalWeight - 1) < 0.01 ? '✓' : '⚠'}
        </span>
      </div>
    </div>
  )
}
