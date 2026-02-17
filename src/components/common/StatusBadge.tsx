import type { NodeStatus } from '@/types'

const config: Record<NodeStatus, { label: string; class: string }> = {
  active: { label: '진행중', class: 'bg-primary/15 text-primary border-primary/30' },
  at_risk: { label: '위험', class: 'bg-warning/15 text-warning border-warning/30' },
  completed: { label: '완료', class: 'bg-success/15 text-success border-success/30' },
  paused: { label: '중단', class: 'bg-text-muted/15 text-text-muted border-text-muted/30' },
}

export function StatusBadge({ status }: { status: NodeStatus }) {
  const c = config[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${c.class}`}>
      {c.label}
    </span>
  )
}
