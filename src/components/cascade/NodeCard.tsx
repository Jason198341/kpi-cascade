import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useCascadeStore } from '@/stores/cascadeStore'
import { useUIStore } from '@/stores/uiStore'
import { ProgressRing } from '@/components/common/ProgressRing'
import { StatusBadge } from '@/components/common/StatusBadge'
import { DepthTag } from '@/components/common/DepthTag'
import type { KpiNode, Depth } from '@/types'

const depthWidths: Record<Depth, string> = {
  0: 'w-full md:w-80',
  1: 'w-full md:w-68',
  2: 'w-full md:w-60',
}

const depthBorders: Record<Depth, string> = {
  0: 'border-depth-0/20 hover:border-depth-0/40',
  1: 'border-depth-1/20 hover:border-depth-1/40',
  2: 'border-depth-2/20 hover:border-depth-2/40',
}

const depthGlows: Record<Depth, string> = {
  0: 'glow-depth-0 ring-1 ring-depth-0/30',
  1: 'glow-depth-1 ring-1 ring-depth-1/30',
  2: 'glow-depth-2 ring-1 ring-depth-2/30',
}

interface Props {
  node: KpiNode
  onClick?: () => void
  showTrace?: boolean
}

export function NodeCard({ node, onClick, showTrace }: Props) {
  const navigate = useNavigate()
  const getProgress = useCascadeStore((s) => s.getProgress)
  const childrenMap = useCascadeStore((s) => s.childrenMap)
  const selectedNodeId = useCascadeStore((s) => s.selectedNodeId)
  const selectNode = useCascadeStore((s) => s.selectNode)
  const t = useUIStore((s) => s.t)
  const progress = getProgress(node.id)
  const isSelected = selectedNodeId === node.id
  const hasChildren = (childrenMap[node.id] || []).length > 0

  const handleClick = () => {
    selectNode(node.id)
    onClick?.()
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        ${depthWidths[node.depth]} p-4 rounded-xl border cursor-pointer
        bg-surface card-gradient transition-all duration-200 shrink-0
        ${depthBorders[node.depth]}
        ${isSelected ? depthGlows[node.depth] : ''}
      `}
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">{node.emoji}</span>
          <h3 className="text-sm font-semibold truncate">{node.title}</h3>
        </div>
        <ProgressRing progress={progress} depth={node.depth} size={40} strokeWidth={3} />
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 mb-3">
        <DepthTag depth={node.depth} />
        <StatusBadge status={node.status} />
      </div>

      {/* Progress bar — thin & refined */}
      <div className="h-1 rounded-full bg-surface-light overflow-hidden mb-2">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: `var(--color-depth-${node.depth})` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, progress)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Metrics */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        {node.milestones && node.milestones.length > 0 ? (
          <span className="font-mono">
            ✓ {node.milestones.filter((m) => m.done).length}/{node.milestones.length}
          </span>
        ) : hasChildren ? (
          <span className="font-mono">
            {(childrenMap[node.id] || []).length}{t('cascade.subItems')}
          </span>
        ) : (
          <span className="font-mono">{node.current_value}/{node.target_value} {node.unit}</span>
        )}
        <span className="font-mono font-semibold" style={{ color: `var(--color-depth-${node.depth})` }}>
          {Math.round(progress)}%
        </span>
      </div>

      {/* Trace link for leaf nodes */}
      {showTrace && node.depth === 2 && (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/trace/${node.id}`) }}
          className="mt-3 w-full text-xs text-trace hover:underline flex items-center justify-center gap-1 cursor-pointer"
        >
          ✦ {t('trace.viewTrace')}
        </button>
      )}
    </motion.div>
  )
}
