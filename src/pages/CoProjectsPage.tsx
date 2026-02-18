import { useState, useMemo } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { CO_VEHICLES } from '@/data/co-seed'
import { CO_TYPE_LABELS, REASON_LABELS, type CoType, type ReasonCategory } from '@/types/commonization'

export default function CoProjectsPage() {
  const t = useUIStore((s) => s.t)
  const lang = useUIStore((s) => s.lang)
  const [activeVehicle, setActiveVehicle] = useState(CO_VEHICLES[0].code)
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null)

  const vehicle = useMemo(() => CO_VEHICLES.find(v => v.code === activeVehicle)!, [activeVehicle])

  const coLabel = (code: CoType) => CO_TYPE_LABELS[code]?.[lang] || code
  const reasonLabel = (code: ReasonCategory) => REASON_LABELS[code]?.[lang] || code

  const coTypeColor = (code: CoType) => ({
    level1_co: 'bg-purple-500/15 text-purple-400',
    level2_co: 'bg-cyan-500/15 text-cyan-400',
    new_dev: 'bg-amber-500/15 text-amber-400',
  })[code] || 'bg-gray-500/15 text-gray-400'

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <h2 className="text-lg font-bold mb-4">{t('co.projects.title')}</h2>

      {/* Vehicle tabs */}
      <div className="flex gap-2 mb-6">
        {CO_VEHICLES.map(v => (
          <button
            key={v.code}
            onClick={() => { setActiveVehicle(v.code); setExpandedSystem(null) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
              ${activeVehicle === v.code
                ? 'bg-primary text-white'
                : 'bg-surface border border-surface-border text-text-muted hover:text-text'
              }`}
          >
            {v.code}
            <span className="text-[10px] ml-1.5 opacity-70">{v.stage}</span>
          </button>
        ))}
      </div>

      {/* Vehicle info header */}
      <div className="bg-surface rounded-xl border border-surface-border p-4 mb-4 flex flex-wrap gap-6 text-sm">
        <Info label={t('co.dashboard.vehicles')} value={vehicle.name} />
        <Info label="Stage" value={vehicle.stage} />
        <Info label="SOP" value={vehicle.sopDate} />
        <Info label="Type" value={vehicle.vehicleType} />
        <Info label="Volume" value={vehicle.salesVolume.toLocaleString()} />
      </div>

      {/* Systems table */}
      <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface-light/30">
              <th className="text-left px-4 py-3 font-semibold text-text-muted">{t('co.projects.system')}</th>
              <th className="text-left px-4 py-3 font-semibold text-text-muted">{t('co.projects.coType')}</th>
              <th className="text-left px-4 py-3 font-semibold text-text-muted">{t('co.projects.base')}</th>
              <th className="text-right px-4 py-3 font-semibold text-text-muted">{t('co.projects.parts')}</th>
              <th className="text-right px-4 py-3 font-semibold text-text-muted">{t('co.projects.coCount')}</th>
              <th className="text-right px-4 py-3 font-semibold text-text-muted">{t('co.projects.rate')}</th>
            </tr>
          </thead>
          <tbody>
            {vehicle.systems.map(sys => {
              const total = sys.subParts.length
              const coCount = sys.subParts.filter(p => p.isCo).length
              const rate = total > 0 ? Math.round((coCount / total) * 100) : 0
              const isExpanded = expandedSystem === sys.systemName
              return (
                <SystemRow
                  key={sys.systemName}
                  systemName={sys.systemName}
                  coType={coLabel(sys.coTypeCode)}
                  coTypeClass={coTypeColor(sys.coTypeCode)}
                  baseVehicle={sys.baseVehicleCode}
                  total={total}
                  coCount={coCount}
                  rate={rate}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedSystem(isExpanded ? null : sys.systemName)}
                  subParts={sys.subParts.map(p => ({
                    partName: p.partName,
                    partNo: p.partNo,
                    isCo: p.isCo,
                    source: p.coSourceVehicle || '-',
                    supplier: p.supplier,
                    region: p.supplierRegion,
                    cost: p.materialCostUsd,
                    reason: p.reasonDetail ? reasonLabel(p.reasonDetail.categoryCode) : '-',
                    possibility: p.reasonDetail?.coPossibility,
                  }))}
                  t={t}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-text-muted text-xs">{label}</span>
      <span className="ml-2 font-medium">{value}</span>
    </div>
  )
}

interface SubPartRow {
  partName: string
  partNo: string
  isCo: boolean
  source: string
  supplier: string
  region: string
  cost: number
  reason: string
  possibility?: string
}

function SystemRow({ systemName, coType, coTypeClass, baseVehicle, total, coCount, rate, isExpanded, onToggle, subParts, t }: {
  systemName: string; coType: string; coTypeClass: string; baseVehicle: string
  total: number; coCount: number; rate: number; isExpanded: boolean
  onToggle: () => void; subParts: SubPartRow[]; t: (k: string) => string
}) {
  const possColor = (p?: string) => ({
    high: 'text-emerald-400',
    medium: 'text-amber-400',
    low: 'text-red-400',
    none: 'text-text-muted',
  })[p || 'none'] || 'text-text-muted'

  return (
    <>
      <tr
        className="border-b border-surface-border hover:bg-surface-light/20 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-4 py-3 font-medium">
          <span className="mr-2 text-text-muted text-xs">{isExpanded ? '▼' : '▶'}</span>
          {systemName}
        </td>
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${coTypeClass}`}>{coType}</span>
        </td>
        <td className="px-4 py-3 text-text-muted">{baseVehicle}</td>
        <td className="px-4 py-3 text-right">{total}</td>
        <td className="px-4 py-3 text-right">{coCount}</td>
        <td className="px-4 py-3 text-right">
          <span className={rate >= 70 ? 'text-emerald-400' : rate >= 40 ? 'text-amber-400' : 'text-red-400'}>
            {rate}%
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={6} className="bg-surface-light/10">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-text-muted border-b border-surface-border/50">
                  <th className="text-left px-6 py-2">{t('co.projects.partName')}</th>
                  <th className="text-left px-3 py-2">{t('co.projects.partNo')}</th>
                  <th className="text-center px-3 py-2">{t('co.projects.isCo')}</th>
                  <th className="text-left px-3 py-2">{t('co.projects.source')}</th>
                  <th className="text-left px-3 py-2">{t('co.projects.supplier')}</th>
                  <th className="text-right px-3 py-2">{t('co.projects.cost')}</th>
                  <th className="text-left px-3 py-2">{t('co.projects.reason')}</th>
                </tr>
              </thead>
              <tbody>
                {subParts.map(p => (
                  <tr key={p.partNo} className="border-b border-surface-border/30">
                    <td className="px-6 py-2">{p.partName}</td>
                    <td className="px-3 py-2 text-text-muted font-mono">{p.partNo}</td>
                    <td className="px-3 py-2 text-center">
                      {p.isCo
                        ? <span className="text-emerald-400 font-bold">O</span>
                        : <span className="text-red-400">X</span>}
                    </td>
                    <td className="px-3 py-2 text-text-muted">{p.source}</td>
                    <td className="px-3 py-2">{p.supplier} <span className="text-text-muted">({p.region})</span></td>
                    <td className="px-3 py-2 text-right">${p.cost.toFixed(1)}</td>
                    <td className="px-3 py-2">
                      {p.reason !== '-' && (
                        <span className={possColor(p.possibility)}>{p.reason}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  )
}
