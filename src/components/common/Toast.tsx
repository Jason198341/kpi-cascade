import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/stores/uiStore'

const icons = { success: '✓', error: '✕', info: 'ℹ' }
const colors = {
  success: 'border-success/40 text-success',
  error: 'border-danger/40 text-danger',
  info: 'border-primary/40 text-primary',
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts)
  const dismiss = useUIStore((s) => s.dismissToast)

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`glass rounded-lg px-4 py-3 flex items-center gap-3 min-w-[280px] cursor-pointer ${colors[t.type]}`}
            onClick={() => dismiss(t.id)}
          >
            <span className="text-lg">{icons[t.type]}</span>
            <span className="text-sm text-text">{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
