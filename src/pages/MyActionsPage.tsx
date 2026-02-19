import { useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { ProgressRing } from '@/components/common/ProgressRing'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { ExecLogPanel } from '@/components/cascade/ExecLogPanel'
import { ExecInsightPanel } from '@/components/cascade/ExecInsightPanel'
import { NodeFormModal } from '@/components/cascade/NodeFormModal'
import { useCascadeStore } from '@/stores/cascadeStore'
import { useAuthStore } from '@/stores/authStore'
import { useOrgStore } from '@/stores/orgStore'
import { useUIStore } from '@/stores/uiStore'
import { daysUntil, isOverdue } from '@/lib/date'
import type { KpiNode, Depth } from '@/types'
import { DEPTH_LABELS } from '@/types'

const MAX_VISIBLE_MILESTONES = 5

// ── Mobile full-screen edit overlay ──────────────────────────────────
function MobileEditOverlay({
  node,
  onClose,
}: {
  node: KpiNode
  onClose: () => void
}) {
  const updateProgress = useCascadeStore((s) => s.updateProgress)
  const toggleMilestone = useCascadeStore((s) => s.toggleMilestone)
  const getProgress = useCascadeStore((s) => s.getProgress)
  const toast = useUIStore((s) => s.toast)
  const t = useUIStore((s) => s.t)

  const progress = getProgress(node.id)
  const hasMilestones = node.milestones && node.milestones.length > 0
  const [tempValue, setTempValue] = useState(node.current_value)

  const handleSave = async () => {
    await updateProgress(node.id, tempValue)
    toast(t('actions.progressUpdated'), 'success')
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-bg md:hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
        <h2 className="text-sm font-semibold">{t('actions.updateAction')}</h2>
        <button onClick={onClose} className="text-text-muted hover:text-text text-lg cursor-pointer">✕</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
        {/* Node info */}
        <div className="flex items-center gap-4">
          <ProgressRing progress={progress} depth={2} size={56} strokeWidth={4} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{node.emoji}</span>
              <h3 className="text-base font-semibold truncate">{node.title}</h3>
            </div>
            <StatusBadge status={node.status} />
          </div>
        </div>

        {hasMilestones ? (
          /* Milestone checklist */
          <div className="flex flex-col gap-2">
            <div className="text-xs text-text-muted font-medium">{t('milestone.progress')}</div>
            {node.milestones!.map((m) => (
              <label key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-surface-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={m.done}
                  onChange={() => toggleMilestone(node.id, m.id)}
                  className="accent-depth-2 w-5 h-5 shrink-0 cursor-pointer"
                />
                <span className={`text-sm ${m.done ? 'line-through text-text-muted' : 'text-text'}`}>
                  {m.label}
                </span>
              </label>
            ))}
          </div>
        ) : (
          /* Slider */
          <div className="flex flex-col gap-4">
            <div className="text-xs text-text-muted font-medium">{t('node.progress')}</div>
            <input
              type="range"
              min={0}
              max={node.target_value}
              value={tempValue}
              onChange={(e) => setTempValue(+e.target.value)}
              className="w-full h-3 accent-depth-2"
            />
            <div className="text-center text-2xl font-bold font-mono text-depth-2">
              {tempValue}<span className="text-base text-text-muted">/{node.target_value} {node.unit}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="p-4 border-t border-surface-border flex gap-3">
        {!hasMilestones && (
          <Button onClick={handleSave} className="flex-1">
            {t('common.save')}
          </Button>
        )}
        <Button variant={hasMilestones ? 'primary' : 'ghost'} onClick={onClose} className="flex-1">
          {hasMilestones ? t('common.done') : t('common.cancel')}
        </Button>
      </div>
    </motion.div>
  )
}

// ── Compact summary row for depth-0/1 nodes (exec view) ──────────────
function ExecNodeRow({
  node,
  depth,
  onEdit,
  onDelete,
}: {
  node: KpiNode
  depth: Depth
  onEdit: (node: KpiNode) => void
  onDelete: (node: KpiNode) => void
}) {
  const getProgress = useCascadeStore((s) => s.getProgress)
  const progress = getProgress(node.id)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-surface-border rounded-lg bg-surface overflow-hidden group"
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span className="text-base shrink-0">{node.emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate">{node.title}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-16 h-1.5 rounded-full bg-surface-light overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, progress)}%`,
                backgroundColor: depth === 0 ? 'var(--color-depth-0)' : 'var(--color-depth-1)',
              }}
            />
          </div>
          <span className="text-xs font-mono text-text-muted w-9 text-right">
            {Math.round(progress)}%
          </span>
          {/* Edit / Delete */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(node)}
              className="text-xs text-primary hover:text-primary-hover cursor-pointer px-1"
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(node)}
              className="text-xs text-danger hover:text-red-400 cursor-pointer px-1"
              title="Delete"
            >
              🗑
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Action row for depth-2 nodes ──────────────────────────────────────
function ActionRow({
  node,
  isExec,
  onMobileEdit,
  onEdit,
  onDelete,
}: {
  node: KpiNode
  isExec: boolean
  onMobileEdit: (node: KpiNode) => void
  onEdit: (node: KpiNode) => void
  onDelete: (node: KpiNode) => void
}) {
  const navigate = useNavigate()
  const updateProgress = useCascadeStore((s) => s.updateProgress)
  const toggleMilestone = useCascadeStore((s) => s.toggleMilestone)
  const getProgress = useCascadeStore((s) => s.getProgress)
  const getTrace = useCascadeStore((s) => s.getTrace)
  const members = useOrgStore((s) => s.members)
  const toast = useUIStore((s) => s.toast)
  const t = useUIStore((s) => s.t)

  const progress = getProgress(node.id)
  const trace = getTrace(node.id)
  const impact = trace.length > 1 ? trace[0].cumulativeImpact * trace[0].progress : progress
  const days = daysUntil(node.due_date)
  const overdue = isOverdue(node.due_date)
  const owner = node.owner_id ? members.find((m) => m.id === node.owner_id) : null
  const hasMilestones = node.milestones && node.milestones.length > 0

  const [editing, setEditing] = useState(false)
  const [tempValue, setTempValue] = useState(node.current_value)
  const [expanded, setExpanded] = useState(false)

  const handleSave = async () => {
    await updateProgress(node.id, tempValue)
    toast(t('actions.progressUpdated'), 'success')
    setEditing(false)
  }

  const visibleMilestones = hasMilestones
    ? (expanded ? node.milestones! : node.milestones!.slice(0, MAX_VISIBLE_MILESTONES))
    : []
  const hiddenCount = hasMilestones ? Math.max(0, node.milestones!.length - MAX_VISIBLE_MILESTONES) : 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-surface-border rounded-lg bg-surface overflow-hidden group"
    >
      <div className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
        <ProgressRing progress={progress} depth={2} size={42} strokeWidth={3.5} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{node.emoji}</span>
            <h3 className="text-sm font-medium truncate">{node.title}</h3>
            <StatusBadge status={node.status} />
          </div>

          {owner && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-4 h-4 rounded-full bg-depth-2/20 text-depth-2 flex items-center justify-center text-[9px] font-bold">
                {owner.display_name[0]}
              </div>
              <span className="text-[11px] text-text-muted">
                {owner.display_name}
                {owner.department && <span> &middot; {owner.department}</span>}
              </span>
            </div>
          )}

          {/* Milestones */}
          {hasMilestones ? (
            <div className="mt-1.5">
              <div className="flex flex-col gap-0.5">
                {visibleMilestones.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 cursor-pointer group/ms">
                    <input
                      type="checkbox"
                      checked={m.done}
                      onChange={() => toggleMilestone(node.id, m.id)}
                      className="accent-depth-2 w-3.5 h-3.5 shrink-0 cursor-pointer"
                    />
                    <span className={`text-xs ${m.done ? 'line-through text-text-muted' : 'text-text group-hover/ms:text-depth-2'}`}>
                      {m.label}
                    </span>
                  </label>
                ))}
              </div>
              {!expanded && hiddenCount > 0 && (
                <button
                  onClick={() => setExpanded(true)}
                  className="text-xs text-primary hover:underline mt-1 cursor-pointer"
                >
                  ...{t('common.moreCount').replace('{n}', String(hiddenCount))}
                </button>
              )}
              {expanded && hiddenCount > 0 && (
                <button
                  onClick={() => setExpanded(false)}
                  className="text-xs text-primary hover:underline mt-1 cursor-pointer"
                >
                  {t('common.fold')}
                </button>
              )}
              {/* Mobile edit button for milestones */}
              <button
                onClick={() => onMobileEdit(node)}
                className="md:hidden text-xs text-primary hover:underline mt-1.5 cursor-pointer"
              >
                {t('common.edit')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 mt-1.5">
              {/* Desktop inline edit (md+) */}
              {editing ? (
                <div className="hidden md:flex items-center gap-2 flex-1">
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
                  <Button size="sm" onClick={handleSave}>{t('common.save')}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>{t('common.cancel')}</Button>
                </div>
              ) : null}
              {!editing && (
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
                    className="hidden md:inline text-xs text-primary hover:underline cursor-pointer"
                  >
                    {t('common.update')}
                  </button>
                  <button
                    onClick={() => onMobileEdit(node)}
                    className="md:hidden text-xs text-primary hover:underline cursor-pointer"
                  >
                    {t('common.update')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: trace + due date + edit/delete */}
        <div className="text-right shrink-0 flex flex-col items-end gap-1">
          <button
            onClick={() => navigate(`/trace/${node.id}`)}
            className="text-xs text-trace hover:underline cursor-pointer"
          >
            {t('trace.contribution')}: {impact.toFixed(1)}%
          </button>
          {days !== null && (
            <div className={`text-xs ${overdue ? 'text-danger' : days < 7 ? 'text-warning' : 'text-text-muted'}`}>
              {overdue ? t('trace.overdue') : `D-${days}`}
            </div>
          )}
          {/* Edit / Delete buttons */}
          <div className="flex gap-1.5 mt-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(node)}
              className="text-[11px] text-primary hover:underline cursor-pointer"
            >
              {t('common.edit')}
            </button>
            <span className="text-text-muted text-[11px]">|</span>
            <button
              onClick={() => onDelete(node)}
              className="text-[11px] text-danger hover:underline cursor-pointer"
            >
              {t('node.delete')}
            </button>
          </div>
        </div>
      </div>

      {/* ExecLogPanel for executives */}
      {isExec && (
        <div className="px-3 pb-3 sm:px-4 sm:pb-4">
          <ExecLogPanel nodeId={node.id} />
        </div>
      )}
    </motion.div>
  )
}

// ── Depth group header ────────────────────────────────────────────────
function DepthHeader({ depth, count }: { depth: Depth; count: number }) {
  const lang = useUIStore((s) => s.lang)
  const label = DEPTH_LABELS[depth][lang]
  const colors: Record<number, string> = { 0: 'text-depth-0', 1: 'text-depth-1', 2: 'text-depth-2' }

  return (
    <div className="flex items-center gap-2 pt-4 pb-1.5 first:pt-0">
      <div className={`text-xs font-semibold ${colors[depth]}`}>{label}</div>
      <div className="flex-1 h-px bg-surface-border" />
      <span className="text-[10px] text-text-muted">{count}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────
export default function MyActionsPage() {
  const nodes = useCascadeStore((s) => s.nodes)
  const deleteNode = useCascadeStore((s) => s.deleteNode)
  const profile = useAuthStore((s) => s.profile)
  const t = useUIStore((s) => s.t)
  const toast = useUIStore((s) => s.toast)
  const [mobileEditNode, setMobileEditNode] = useState<KpiNode | null>(null)
  const [editingNode, setEditingNode] = useState<KpiNode | null>(null)

  const isExec = profile?.role === 'executive'

  const grouped = useMemo(() => {
    if (isExec) {
      const d0 = nodes.filter((n) => n.depth === 0).sort((a, b) => a.sort_order - b.sort_order)
      const d1 = nodes.filter((n) => n.depth === 1).sort((a, b) => a.sort_order - b.sort_order)
      const d2 = nodes.filter((n) => n.depth === 2).sort((a, b) => a.sort_order - b.sort_order)
      return { d0, d1, d2 }
    }
    return {
      d0: [] as KpiNode[],
      d1: [] as KpiNode[],
      d2: nodes.filter((n) => n.depth === 2).sort((a, b) => a.sort_order - b.sort_order),
    }
  }, [nodes, isExec])

  const totalCount = grouped.d0.length + grouped.d1.length + grouped.d2.length
  const subtitle = isExec
    ? `${totalCount}${t('actions.managing')}`
    : grouped.d2.length > 0
      ? `${grouped.d2.length}${t('actions.inProgress')}`
      : undefined

  const handleEdit = useCallback((node: KpiNode) => {
    setEditingNode(node)
  }, [])

  const handleDelete = useCallback(async (node: KpiNode) => {
    const msg = t('settings.confirmRemove').replace('{name}', node.title)
    if (!confirm(msg)) return
    await deleteNode(node.id)
    toast(t('settings.removed'), 'success')
  }, [deleteNode, toast, t])

  return (
    <>
      <Header title={t('nav.myActions')} subtitle={subtitle} />
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {totalCount === 0 ? (
          <EmptyState emoji="⚡" title={t('actions.noActions')} description={t('actions.noActionsDesc')} />
        ) : (
          <div className="max-w-3xl mx-auto flex flex-col gap-2">
            {/* AI Insight for executives */}
            {isExec && <ExecInsightPanel />}

            {/* Depth 0: Strategic Goals (exec only) */}
            {grouped.d0.length > 0 && (
              <>
                <DepthHeader depth={0} count={grouped.d0.length} />
                {grouped.d0.map((node) => (
                  <ExecNodeRow key={node.id} node={node} depth={0} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </>
            )}

            {/* Depth 1: Team KPIs (exec only) */}
            {grouped.d1.length > 0 && (
              <>
                <DepthHeader depth={1} count={grouped.d1.length} />
                {grouped.d1.map((node) => (
                  <ExecNodeRow key={node.id} node={node} depth={1} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </>
            )}

            {/* Depth 2: Action Plans (all users) */}
            {grouped.d2.length > 0 && (
              <>
                {isExec && <DepthHeader depth={2} count={grouped.d2.length} />}
                {grouped.d2.map((node) => (
                  <ActionRow
                    key={node.id}
                    node={node}
                    isExec={isExec}
                    onMobileEdit={setMobileEditNode}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile full-screen edit overlay */}
      <AnimatePresence>
        {mobileEditNode && (
          <MobileEditOverlay
            node={mobileEditNode}
            onClose={() => setMobileEditNode(null)}
          />
        )}
      </AnimatePresence>

      {/* Full edit modal (NodeFormModal) */}
      {editingNode && (
        <NodeFormModal
          open={!!editingNode}
          onClose={() => setEditingNode(null)}
          editNode={editingNode}
          depth={editingNode.depth}
        />
      )}
    </>
  )
}
