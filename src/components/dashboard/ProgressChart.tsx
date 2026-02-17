import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useCascadeStore } from '@/stores/cascadeStore'

export function ProgressChart() {
  const nodes = useCascadeStore((s) => s.nodes)
  const getProgress = useCascadeStore((s) => s.getProgress)

  // Simulate trend data from current progress
  const data = useMemo(() => {
    const roots = nodes.filter((n) => n.depth === 0)
    const months = ['1월', '2월', '3월', '4월', '5월', '6월']
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
      <h3 className="text-sm font-medium text-text-muted mb-4">진행 추세</h3>
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
  )
}
