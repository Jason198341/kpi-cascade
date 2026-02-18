import { useUIStore } from '@/stores/uiStore'
import type { NodeStatus } from '@/types'

const config: Record<NodeStatus, { key: string; class: string }> = {
  active: { key: 'status.active', class: 'bg-primary/10 text-primary border-primary/20' },
  at_risk: { key: 'status.at_risk', class: 'bg-warning/10 text-warning border-warning/20' },
  completed: { key: 'status.completed', class: 'bg-success/10 text-success border-success/20' },
  paused: { key: 'status.paused', class: 'bg-text-muted/10 text-text-muted border-text-muted/20' },
}

export function StatusBadge({ status }: { status: NodeStatus }) {
  const t = useUIStore((s) => s.t)
  const c = config[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${c.class}`}>
      {t(c.key)}
    </span>
  )
}
