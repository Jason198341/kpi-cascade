import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useCascadeStore } from '@/stores/cascadeStore'
import { useUIStore } from '@/stores/uiStore'

export function ProgressChart() {
  const nodes = useCascadeStore((s) => s.nodes)
  const getProgress = useCascadeStore((s) => s.getProgress)
  const t = useUIStore((s) => s.t)

  // Simulate trend data from current progress
  const data = useMemo(() => {
    const roots = nodes.filter((n) => n.depth === 0)
    const months = [t('month.1'), t('month.2'), t('month.3'), t('month.4'), t('month.5'), t('month.6')]
    return months.map((month, i) => {
      const factor = (i + 1) / 6
      const entry: Record<string, unknown> = { month }
      for (const root of roots) {
        const currentProg = getProgress(root.id)
        entry[root.title.slice(0, 8)] = Math.round(currentProg * factor * (0.8 + Math.random() * 0.4))
      }
      return entry
    })
  }, [nodes, getProgress])

  const lineColors = ['var(--color-depth-0)', 'var(--color-depth-1)', 'var(--color-depth-2)']

  const roots = nodes.filter((n) => n.depth === 0)

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-sm font-medium text-text-muted mb-4">{t('dashboard.progress')}</h3>
      <div
        role="img"
        aria-label={`전략 목표별 월간 진행률 추세 차트. ${roots.map((r) => r.title).join(', ')}`}
      >
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border)" />
          <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-surface-border)',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          {roots.map((root, i) => (
            <Line
              key={root.id}
              type="monotone"
              dataKey={root.title.slice(0, 8)}
              stroke={lineColors[i % lineColors.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
