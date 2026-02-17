import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCascadeStore } from '@/stores/cascadeStore'
import { useOrgStore } from '@/stores/orgStore'
import { useUIStore } from '@/stores/uiStore'
import { ProgressRing } from '@/components/common/ProgressRing'
import { StatusBadge } from '@/components/common/StatusBadge'
import { DepthTag } from '@/components/common/DepthTag'
import { Button } from '@/components/common/Button'
import { NodeFormModal } from './NodeFormModal'
import { MiniTrace } from './MiniTrace'
import { formatDate, daysUntil } from '@/lib/date'
import type { Depth } from '@/types'

export function NodeDetailPanel() {
  const navigate = useNavigate()
  const selectedNodeId = useCascadeStore((s) => s.selectedNodeId)
  const nodeMap = useCascadeStore((s) => s.nodeMap)
  const getProgress = useCascadeStore((s) => s.getProgress)
  const getChildren = useCascadeStore((s) => s.getChildren)
  const selectNode = useCascadeStore((s) => s.selectNode)
  const deleteNode = useCascadeStore((s) => s.deleteNode)
  const toggleMilestone = useCascadeStore((s) => s.toggleMilestone)
  const members = useOrgStore((s) => s.members)
  const toast = useUIStore((s) => s.toast)
  const t = useUIStore((s) => s.t)

  const [editOpen, setEditOpen] = useState(false)
  const [addChildOpen, setAddChildOpen] = useState(false)

  const node = selectedNodeId ? nodeMap[selectedNodeId] : null
  if (!node) return null

  const progress = getProgress(node.id)
  const children = getChildren(node.id)
  const days = daysUntil(node.due_date)
  const childDepth = Math.min(node.depth + 1, 2) as Depth
  const owner = node.owner_id ? members.find((m) => m.id === node.owner_id) : null
  const hasMilestones = node.milestones && node.milestones.length > 0

  const handleDelete = async () => {
    if (!confirm('이 항목과 하위 항목을 삭제하시겠습니까?')) return
    await deleteNode(node.id)
    toast('삭제되었습니다', 'info')
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={node.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="w-[85vw] max-w-80 h-full border-l border-surface-border bg-surface p-4 md:p-5 overflow-y-auto shrink-0 card-gradient"
      >
        {/* Close */}
        <div className="flex items-center justify-between mb-4">
          <DepthTag depth={node.depth} />
          <button onClick={() => selectNode(null)} className="text-text-muted hover:text-text cursor-pointer">✕</button>
        </div>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{node.emoji}</span>
          <div>
            <h2 className="text-lg font-bold">{node.title}</h2>
            <StatusBadge status={node.status} />
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-4 mb-5">
          <ProgressRing progress={progress} depth={node.depth} size={64} strokeWidth={5} />
          <div>
            <div className="text-2xl font-bold font-mono" style={{ color: `var(--color-depth-${node.depth})` }}>
              {Math.round(progress)}%
            </div>
            {hasMilestones ? (
              <div className="text-xs text-text-muted">
                ✓ {node.milestones!.filter((m) => m.done).length}/{node.milestones!.length} {t('milestone.progress')}
              </div>
            ) : children.length > 0 ? (
              <div className="text-xs text-text-muted">
                {children.length}개 하위 항목
              </div>
            ) : (
              <div className="text-xs text-text-muted">
                {node.current_value}/{node.target_value} {node.unit}
              </div>
            )}
          </div>
        </div>

        {/* Owner */}
        {owner && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-surface-light">
            <div className="w-6 h-6 rounded-full bg-depth-2/20 text-depth-2 flex items-center justify-center text-xs font-bold shrink-0">
              {owner.display_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm">{owner.display_name}</span>
              {owner.department && (
                <span className="text-xs text-text-muted ml-1.5">&middot; {owner.department}</span>
              )}
            </div>
            <span className="text-xs text-text-muted shrink-0">{t('people.owner') || '담당자'}</span>
          </div>
        )}

        {/* Milestones checklist */}
        {hasMilestones && (
          <div className="mb-5">
            <div className="text-xs text-text-muted font-medium mb-2">{t('milestone.progress')}</div>
            <div className="flex flex-col gap-1">
              {node.milestones!.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors
                    ${m.done ? 'bg-depth-2/10' : 'bg-surface-light hover:bg-surface-light/80'}`}
                >
                  <input
                    type="checkbox"
                    checked={m.done}
                    onChange={() => toggleMilestone(node.id, m.id)}
                    className="accent-depth-2 w-4 h-4 shrink-0 cursor-pointer"
                  />
                  <span className={`text-sm ${m.done ? 'line-through text-text-muted' : ''}`}>
                    {m.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {node.description && (
          <p className="text-sm text-text-muted mb-4 leading-relaxed">{node.description}</p>
        )}

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3 mb-5 text-sm p-3 rounded-lg bg-surface-light/50">
          <div>
            <span className="text-xs text-text-muted">{t('node.weight')}</span>
            <div className="font-mono font-semibold mt-0.5">×{node.weight.toFixed(2)}</div>
          </div>
          <div>
            <span className="text-xs text-text-muted">{t('node.dueDate')}</span>
            <div className={`mt-0.5 ${days !== null && days < 7 ? 'text-warning' : ''}`}>
              {formatDate(node.due_date)}
              {days !== null && <span className="text-xs ml-1">({days}일)</span>}
            </div>
          </div>
        </div>

        {/* Mini Trace (for depth > 0) */}
        {node.depth > 0 && <MiniTrace nodeId={node.id} />}

        {/* Children count */}
        {children.length > 0 && (
          <div className="text-sm text-text-muted mb-4">
            하위 항목: <span className="font-semibold text-text">{children.length}개</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-4">
          {node.depth === 2 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/trace/${node.id}`)}
              className="w-full"
            >
              ✦ {t('trace.title')}
            </Button>
          )}
          {node.depth < 2 && (
            <Button size="sm" onClick={() => setAddChildOpen(true)} className="w-full">
              + 하위 항목 추가
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)} className="flex-1">
              {t('node.edit')}
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} className="flex-1">
              {t('node.delete')}
            </Button>
          </div>
        </div>

        <NodeFormModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          editNode={node}
          depth={node.depth}
        />
        <NodeFormModal
          open={addChildOpen}
          onClose={() => setAddChildOpen(false)}
          parentId={node.id}
          depth={childDepth}
        />
      </motion.div>
    </AnimatePresence>
  )
}
