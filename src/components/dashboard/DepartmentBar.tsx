import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { useCascadeStore } from '@/stores/cascadeStore'
import { useUIStore } from '@/stores/uiStore'

export function DepartmentBar() {
  const nodes = useCascadeStore((s) => s.nodes)
  const getProgress = useCascadeStore((s) => s.getProgress)
  const t = useUIStore((s) => s.t)

  const data = useMemo(() => {
    return nodes
      .filter((n) => n.depth === 1)
      .map((n) => ({
        name: n.emoji + ' ' + n.title.slice(0, 10),
        progress: Math.round(getProgress(n.id)),
        id: n.id,
      }))
      .sort((a, b) => b.progress - a.progress)
  }, [nodes, getProgress])

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-sm font-medium text-text-muted mb-4">{t('dashboard.teamProgress')}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-surface-border)',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="progress" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => (
              <Cell
                key={d.id}
                fill={d.progress >= 70 ? 'var(--color-success)' : d.progress >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
