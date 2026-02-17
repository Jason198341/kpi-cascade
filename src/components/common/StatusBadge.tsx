import type { NodeStatus } from '@/types'

const config: Record<NodeStatus, { label: string; class: string }> = {
  active: { label: '진행중', class: 'bg-primary/10 text-primary border-primary/20' },
  at_risk: { label: '위험', class: 'bg-warning/10 text-warning border-warning/20' },
  completed: { label: '완료', class: 'bg-success/10 text-success border-success/20' },
  paused: { label: '중단', class: 'bg-text-muted/10 text-text-muted border-text-muted/20' },
}

export function StatusBadge({ status }: { status: NodeStatus }) {
  const c = config[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${c.class}`}>
      {c.label}
    </span>
  )
}
