import { useCoachStore } from '@/stores/coachStore'
import { useUIStore } from '@/stores/uiStore'
import type { CoachMode } from '@/types/ai'

const MODES: { mode: CoachMode; icon: string; labelKey: string }[] = [
  { mode: 'analyze', icon: '🔍', labelKey: 'coach.analyze' },
  { mode: 'suggest', icon: '💡', labelKey: 'coach.suggest' },
  { mode: 'report', icon: '📋', labelKey: 'coach.report' },
]

export function CoachModeSelector() {
  const mode = useCoachStore((s) => s.mode)
  const setMode = useCoachStore((s) => s.setMode)
  const t = useUIStore((s) => s.t)

  return (
    <div className="flex gap-1 p-1 bg-surface-light rounded-lg">
      {MODES.map((m) => (
        <button
          key={m.mode}
          onClick={() => setMode(m.mode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer
            ${mode === m.mode
              ? 'bg-primary/15 text-primary font-medium'
              : 'text-text-muted hover:text-text'
            }`}
        >
          <span>{m.icon}</span>
          <span>{t(m.labelKey)}</span>
        </button>
      ))}
    </div>
  )
}
