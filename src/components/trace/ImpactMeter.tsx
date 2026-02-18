import { motion } from 'framer-motion'
import { useUIStore } from '@/stores/uiStore'

interface Props {
  impact: number  // 0-100 scale
}

export function ImpactMeter({ impact }: Props) {
  const t = useUIStore((s) => s.t)
  const display = Math.max(0, Math.min(100, impact))

  return (
    <motion.div
      className="relative p-6 rounded-2xl border border-trace/30 bg-gradient-to-br from-trace/5 to-transparent glow-trace text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, type: 'spring' }}
    >
      <div className="text-sm text-trace/70 mb-2">{t('trace.myImpact')}</div>
      <motion.div
        className="text-5xl font-bold font-mono text-trace"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {display.toFixed(1)}
        <span className="text-2xl">%</span>
      </motion.div>
      <div className="mt-3 h-2 rounded-full bg-surface-light overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-trace/60 to-trace"
          initial={{ width: 0 }}
          animate={{ width: `${display}%` }}
          transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
        />
      </div>
      <p className="text-xs text-text-muted mt-3">
        {t('trace.impactDesc')}
      </p>
    </motion.div>
  )
}
