import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { ProgressRing } from '@/components/common/ProgressRing'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { useCascadeStore } from '@/stores/cascadeStore'
import { useUIStore } from '@/stores/uiStore'
import { formatDate, daysUntil, isOverdue } from '@/lib/date'
import type { KpiNode } from '@/types'

function ActionRow({ node }: { node: KpiNode }) {
  const navigate = useNavigate()
  const updateProgress = useCascadeStore((s) => s.updateProgress)
  const getProgress = useCascadeStore((s) => s.getProgress)
  const getTrace = useCascadeStore((s) => s.getTrace)
  const toast = useUIStore((s) => s.toast)

  const progress = getProgress(node.id)
  const trace = getTrace(node.id)
  const rootStep = trace[trace.length - 1]
  const impact = trace.length > 1 ? trace[0].cumulativeImpact * trace[0].progress : progress
  const days = daysUntil(node.due_date)
  const overdue = isOverdue(node.due_date)

  const [editing, setEditing] = useState(false)
  const [tempValue, setTempValue] = useState(node.current_value)

  const handleSave = async () => {
    await updateProgress(node.id, tempValue)
    toast('진행률이 업데이트되었습니다', 'success')
    setEditing(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border border-surface-border bg-surface hover:border-depth-2/30 transition-colors"
    >
      <div className="flex items-center gap-4">
        <ProgressRing progress={progress} depth={2} size={48} strokeWidth={4} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{node.emoji}</span>
            <h3 className="text-sm font-semibold truncate">{node.title}</h3>
            <StatusBadge status={node.status} />
          </div>

          {/* Inline progress slider */}
          <div className="flex items-center gap-3 mt-2">
            {editing ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="range"
                  min={0}
                  max={node.target_value}
                  value={tempValue}
                  onChange={(e) => setTempValue(+e.target.value)}
                  className="flex-1 accent-depth-2"
                />
                <span className="text-xs font-mono w-16 text-right">
                  {tempValue}/{node.target_value}
                </span>
                <Button size="sm" onClick={handleSave}>저장</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>취소</Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-1 h-1.5 rounded-full bg-surface-light overflow-hidden">
                  <div
                    className="h-full rounded-full bg-depth-2 transition-all duration-500"
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-text-muted">
                  {node.current_value}/{node.target_value} {node.unit}
                </span>
                <button
                  onClick={() => { setTempValue(node.current_value); setEditing(true) }}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  업데이트
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right side: trace + due date */}
        <div className="text-right shrink-0">
          <button
            onClick={() => navigate(`/trace/${node.id}`)}
            className="text-xs text-trace hover:underline cursor-pointer block mb-1"
          >
            기여도: {impact.toFixed(1)}%
          </button>
          {rootStep && trace.length > 1 && (
            <div className="text-xs text-text-muted">→ {rootStep.node.emoji} {rootStep.node.title.slice(0, 10)}…</div>
          )}
          {days !== null && (
            <div className={`text-xs mt-1 ${overdue ? 'text-danger' : days < 7 ? 'text-warning' : 'text-text-muted'}`}>
              {overdue ? '기한 초과' : `D-${days}`}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function MyActionsPage() {
  const nodes = useCascadeStore((s) => s.nodes)
  const t = useUIStore((s) => s.t)

  const actions = useMemo(
    () => nodes.filter((n) => n.depth === 2).sort((a, b) => a.sort_order - b.sort_order),
    [nodes],
  )

  return (
    <>
      <Header title={t('nav.myActions')} />
      <div className="flex-1 overflow-auto p-6">
        {actions.length === 0 ? (
          <EmptyState emoji="⚡" title="액션 플랜이 없습니다" description="캐스케이드에서 팀 KPI 하위에 액션을 추가하세요" />
        ) : (
          <div className="max-w-3xl mx-auto flex flex-col gap-3">
            <div className="text-sm text-text-muted mb-2">{actions.length}개 액션</div>
            {actions.map((node) => (
              <ActionRow key={node.id} node={node} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
