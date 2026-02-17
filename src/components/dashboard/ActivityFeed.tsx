import { useMemo } from 'react'
import { useCascadeStore } from '@/stores/cascadeStore'
import { timeAgo } from '@/lib/date'

export function ActivityFeed() {
  const nodes = useCascadeStore((s) => s.nodes)

  // Simulate activity from recently updated nodes
  const activities = useMemo(() => {
    return [...nodes]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10)
      .map((n) => ({
        id: n.id,
        emoji: n.emoji,
        title: n.title,
        action: n.current_value > 0 ? '진행률 업데이트' : '생성됨',
        value: `${n.current_value}/${n.target_value} ${n.unit}`,
        time: timeAgo(n.updated_at),
      }))
  }, [nodes])

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-sm font-medium text-text-muted mb-4">최근 활동</h3>
      <div className="flex flex-col gap-2">
        {activities.map((a) => (
          <div key={a.id} className="flex items-center gap-3 py-2 border-b border-surface-border/50 last:border-0">
            <span className="text-lg">{a.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{a.title}</div>
              <div className="text-xs text-text-muted">{a.action} — {a.value}</div>
            </div>
            <span className="text-xs text-text-muted shrink-0">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
