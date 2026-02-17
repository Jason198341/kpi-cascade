import type { Depth } from '@/types'

interface Props {
  progress: number
  depth?: Depth
  size?: number
  strokeWidth?: number
  className?: string
}

const depthColors: Record<Depth, string> = {
  0: 'var(--color-depth-0)',
  1: 'var(--color-depth-1)',
  2: 'var(--color-depth-2)',
}

export function ProgressRing({ progress, depth = 0, size = 48, strokeWidth = 4, className = '' }: Props) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(100, Math.max(0, progress)) / 100) * circ

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="var(--color-surface-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={depthColors[depth]}
          strokeWidth={strokeWidth}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span
        className="absolute text-xs font-mono font-bold"
        style={{ color: depthColors[depth] }}
      >
        {Math.round(progress)}
      </span>
    </div>
  )
}
