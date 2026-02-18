import { useMemo } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
  BarChart,
} from 'recharts'
import { useUIStore } from '@/stores/uiStore'
import { CO_VEHICLES } from '@/data/co-seed'
import { buildParetoData } from '@/lib/co-utils'
import { REASON_CATEGORIES, REASON_COLORS, type ReasonCategory } from '@/types/commonization'

export default function CoAnalyticsPage() {
  const t = useUIStore((s) => s.t)
  const paretoData = useMemo(() => buildParetoData(), [])
  const totalNonCo = paretoData.reduce((s, d) => s + d.count, 0)
  const totalCost = paretoData.reduce((s, d) => s + d.cost, 0)

  const rl = (cat: string) => t(`co.reason.${cat}`)

  // Vehicle-reason distribution
  const vehicleReasonData = useMemo(() =>
    CO_VEHICLES.map(v => {
      const row: Record<string, number | string> = { vehicle: v.code }
      for (const cat of REASON_CATEGORIES) row[cat] = 0
      for (const s of v.systems) {
        for (const p of s.subParts) {
          if (!p.isCo && p.reasonDetail) {
            row[p.reasonDetail.categoryCode] = (row[p.reasonDetail.categoryCode] as number) + 1
          }
        }
      }
      return row
    }), []
  )

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <h2 className="text-lg font-bold mb-6">{t('co.analytics.title')}</h2>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface rounded-xl border border-surface-border p-4">
          <p className="text-xs text-text-muted">{t('co.dashboard.nonCoParts')}</p>
          <p className="text-2xl font-bold mt-1">{totalNonCo}<span className="text-sm font-normal text-text-muted ml-1">{t('common.count')}</span></p>
        </div>
        <div className="bg-surface rounded-xl border border-surface-border p-4">
          <p className="text-xs text-text-muted">{t('co.dashboard.additionalCost')}</p>
          <p className="text-2xl font-bold mt-1">${totalCost.toLocaleString()}</p>
        </div>
        <div className="bg-surface rounded-xl border border-surface-border p-4">
          <p className="text-xs text-text-muted">Top 2</p>
          <p className="text-2xl font-bold mt-1">
            {paretoData[0] ? rl(paretoData[0].category) : '-'}, {paretoData[1] ? rl(paretoData[1].category) : '-'}
          </p>
        </div>
      </div>

      {/* Pareto Chart */}
      <div className="bg-surface rounded-xl border border-surface-border p-5 mb-8">
        <h3 className="text-sm font-bold mb-1">{t('co.analytics.paretoTitle')}</h3>
        <p className="text-xs text-text-muted mb-4">{t('co.analytics.paretoSub')}</p>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={paretoData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={rl} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} unit="%" />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }}
              labelFormatter={(label) => rl(String(label))}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="count" name={t('co.analytics.count')} barSize={36} radius={[4, 4, 0, 0]}>
              {paretoData.map((d) => (
                <Cell key={d.category} fill={REASON_COLORS[d.category]} />
              ))}
            </Bar>
            <Line yAxisId="right" type="monotone" dataKey="cumPct" name={t('co.analytics.cumPct')} stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4, fill: '#EF4444' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detail table */}
        <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
          <div className="px-5 py-3 border-b border-surface-border">
            <h3 className="text-sm font-bold">{t('co.analytics.detailTitle')}</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-light/20">
                <th className="text-left px-4 py-2.5 font-semibold text-text-muted text-xs">{t('co.analytics.col.reason')}</th>
                <th className="text-right px-4 py-2.5 font-semibold text-text-muted text-xs">{t('co.analytics.col.count')}</th>
                <th className="text-right px-4 py-2.5 font-semibold text-text-muted text-xs">{t('co.analytics.col.cost')}</th>
                <th className="text-right px-4 py-2.5 font-semibold text-text-muted text-xs">{t('co.analytics.col.ratio')}</th>
                <th className="text-right px-4 py-2.5 font-semibold text-text-muted text-xs">{t('co.analytics.col.cumPct')}</th>
              </tr>
            </thead>
            <tbody>
              {paretoData.map((d) => (
                <tr key={d.category} className="border-t border-surface-border/50">
                  <td className="px-4 py-2.5 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: REASON_COLORS[d.category] }} />
                      {rl(d.category)}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">{d.count}</td>
                  <td className="px-4 py-2.5 text-right">${d.cost.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right">{d.ratio}%</td>
                  <td className="px-4 py-2.5 text-right font-medium">{d.cumPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vehicle distribution chart */}
        <div className="bg-surface rounded-xl border border-surface-border p-5">
          <h3 className="text-sm font-bold mb-1">{t('co.analytics.vehicleTitle')}</h3>
          <p className="text-xs text-text-muted mb-4">{t('co.analytics.vehicleSub')}</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vehicleReasonData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="vehicle" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
              <Legend />
              {REASON_CATEGORIES.map((cat, i) => (
                <Bar key={cat} dataKey={cat} name={rl(cat)} stackId="a" fill={REASON_COLORS[cat]}
                  radius={i === REASON_CATEGORIES.length - 1 ? [4, 4, 0, 0] : undefined} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
