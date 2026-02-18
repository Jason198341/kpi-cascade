import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useUIStore } from '@/stores/uiStore'
import { CO_VEHICLES } from '@/data/co-seed'
import { getOverallStats, getSystemSummaries, buildParetoData } from '@/lib/co-utils'
import { CO_TYPE_LABELS, REASON_COLORS, type ReasonCategory } from '@/types/commonization'

const CO_TYPE_COLORS = { level1_co: '#8b5cf6', level2_co: '#06b6d4', new_dev: '#f59e0b' }

export default function CoDashboardPage() {
  const t = useUIStore((s) => s.t)
  const lang = useUIStore((s) => s.lang)
  const stats = useMemo(() => getOverallStats(), [])
  const summaries = useMemo(() => getSystemSummaries(), [])
  const pareto = useMemo(() => buildParetoData(), [])

  const rl = (cat: string) => t(`co.reason.${cat}`)

  // Vehicle-level aggregation for bar chart
  const vehicleData = useMemo(() =>
    CO_VEHICLES.map(v => {
      const totalParts = v.systems.reduce((s, sys) => s + sys.subParts.length, 0)
      const coParts = v.systems.reduce((s, sys) => s + sys.subParts.filter(p => p.isCo).length, 0)
      return {
        vehicle: v.code,
        coParts,
        nonCoParts: totalParts - coParts,
        coRate: totalParts > 0 ? Math.round((coParts / totalParts) * 100) : 0,
      }
    }), []
  )

  // CoType distribution for pie chart
  const coTypeData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of summaries) {
      counts[s.coTypeCode] = (counts[s.coTypeCode] || 0) + 1
    }
    return Object.entries(counts).map(([key, value]) => ({
      name: CO_TYPE_LABELS[key as keyof typeof CO_TYPE_LABELS]?.[lang] || key,
      value,
      code: key,
    }))
  }, [summaries, lang])

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <h2 className="text-lg font-bold mb-6">{t('co.dashboard.title')}</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label={t('co.dashboard.coRate')} value={`${stats.coRate}%`} accent="text-emerald-400" />
        <StatCard label={t('co.dashboard.totalParts')} value={String(stats.totalParts)} sub={`${t('co.dashboard.coParts')}: ${stats.coParts} / ${t('co.dashboard.nonCoParts')}: ${stats.nonCoParts}`} />
        <StatCard label={t('co.dashboard.vehicles')} value={String(stats.vehicleCount)} sub={`${t('co.dashboard.systems')}: ${stats.systemCount}`} />
        <StatCard label={t('co.dashboard.additionalCost')} value={`$${stats.additionalCostUsd.toLocaleString()}`} accent="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Vehicle C/O bar chart */}
        <div className="bg-surface rounded-xl border border-surface-border p-5">
          <h3 className="text-sm font-bold mb-1">{t('co.dashboard.byVehicle')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vehicleData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="vehicle" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
              <Legend />
              <Bar dataKey="coParts" name={t('co.dashboard.coParts')} stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="nonCoParts" name={t('co.dashboard.nonCoParts')} stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* C/O Type pie chart */}
        <div className="bg-surface rounded-xl border border-surface-border p-5">
          <h3 className="text-sm font-bold mb-1">{t('co.projects.coType')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={coTypeData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                {coTypeData.map(d => (
                  <Cell key={d.code} fill={CO_TYPE_COLORS[d.code as keyof typeof CO_TYPE_COLORS] || '#666'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pareto quick view */}
      <div className="bg-surface rounded-xl border border-surface-border p-5">
        <h3 className="text-sm font-bold mb-1">{t('co.dashboard.pareto')}</h3>
        <p className="text-xs text-text-muted mb-4">{t('co.dashboard.paretoSub')}</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {pareto.map(d => (
            <div key={d.category} className="text-center">
              <div className="w-10 h-10 rounded-full mx-auto mb-1.5 flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: REASON_COLORS[d.category] + '20', color: REASON_COLORS[d.category] }}>
                {d.count}
              </div>
              <div className="text-xs font-medium">{rl(d.category)}</div>
              <div className="text-[10px] text-text-muted">{d.ratio}% ({d.cumPct}%)</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-surface rounded-xl border border-surface-border p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent || ''}`}>{value}</p>
      {sub && <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>}
    </div>
  )
}
