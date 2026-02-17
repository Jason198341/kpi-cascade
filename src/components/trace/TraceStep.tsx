import { motion } from 'framer-motion'
import { ProgressRing } from '@/components/common/ProgressRing'
import type { TraceStep as TraceStepType } from '@/types'

interface Props {
  step: TraceStepType
  index: number
  total: number
  isLeaf: boolean
}

export function TraceStepCard({ step, index, total, isLeaf }: Props) {
  const { node, progress, normalizedWeight, cumulativeImpact } = step

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15 }}
      className={`relative p-5 rounded-xl border bg-surface transition-all
        ${isLeaf ? 'border-trace/40 glow-trace' : `border-surface-border`}`}
    >
      {/* Connector line */}
      {index < total - 1 && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <motion.div
            className="w-0.5 h-6 bg-gradient-to-b from-trace/60 to-trace/20"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: index * 0.15 + 0.1 }}
          />
          <motion.div
            className="text-trace text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.15 + 0.2 }}
          >
            ▲
          </motion.div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <ProgressRing progress={progress} depth={node.depth} size={52} strokeWidth={4} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{node.emoji}</span>
            <h3 className="text-sm font-semibold truncate">{node.title}</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span>가중치: <span className="font-mono text-text">×{normalizedWeight.toFixed(2)}</span></span>
            <span>진행률: <span className="font-mono text-text">{Math.round(progress)}%</span></span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-text-muted">누적 기여</div>
          <div className="text-lg font-bold font-mono text-trace">
            {(cumulativeImpact * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    </motion.div>
  )
}
