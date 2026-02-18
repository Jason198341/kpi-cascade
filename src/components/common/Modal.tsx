import { useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-lg max-h-[85dvh] glass rounded-xl p-6 z-10 shadow-xl shadow-black/20 flex flex-col"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-border shrink-0">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button
                onClick={onClose}
                className="text-text-muted hover:text-text p-1 cursor-pointer rounded-md hover:bg-surface-light transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto min-h-0">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
