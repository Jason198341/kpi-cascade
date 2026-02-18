import type {
  CoVehicle, SystemSummary, OpportunityItem, ParetoEntry,
  ReasonCategory, REASON_CATEGORIES
} from '@/types/commonization'
import { CO_VEHICLES } from '@/data/co-seed'

/** Flatten vehicles → system-level summaries */
export function getSystemSummaries(vehicles: CoVehicle[] = CO_VEHICLES): SystemSummary[] {
  return vehicles.flatMap(v =>
    v.systems.map(s => {
      const total = s.subParts.length
      const coCount = s.subParts.filter(p => p.isCo).length
      const coCost = s.subParts.filter(p => p.isCo).reduce((sum, p) => sum + p.materialCostUsd, 0)
      const newDevCost = s.subParts.filter(p => !p.isCo).reduce((sum, p) => sum + p.materialCostUsd, 0)
      return {
        vehicleCode: v.code,
        vehicleName: v.name,
        systemName: s.systemName,
        coTypeCode: s.coTypeCode,
        baseVehicleCode: s.baseVehicleCode,
        totalSubParts: total,
        coSubParts: coCount,
        coRate: total > 0 ? Math.round((coCount / total) * 100) : 0,
        coCostUsd: coCost,
        newDevCostUsd: newDevCost,
        savingsUsd: newDevCost - coCost,
      }
    })
  )
}

/** Get opportunity items (non-C/O parts with high/medium possibility) */
export function getOpportunities(vehicles: CoVehicle[] = CO_VEHICLES): OpportunityItem[] {
  const items: OpportunityItem[] = []
  for (const v of vehicles) {
    for (const s of v.systems) {
      for (const p of s.subParts) {
        if (!p.isCo && p.reasonDetail && (p.reasonDetail.coPossibility === 'high' || p.reasonDetail.coPossibility === 'medium')) {
          items.push({
            vehicleCode: v.code,
            vehicleName: v.name,
            systemName: s.systemName,
            partName: p.partName,
            partNo: p.partNo,
            supplier: p.supplier,
            materialCostUsd: p.materialCostUsd,
            categoryCode: p.reasonDetail.categoryCode,
            coPossibility: p.reasonDetail.coPossibility,
            coCondition: p.reasonDetail.coCondition,
            additionalCostUsd: p.reasonDetail.additionalCostUsd,
            diffDescription: p.reasonDetail.diffDescription,
          })
        }
      }
    }
  }
  return items.sort((a, b) => b.additionalCostUsd - a.additionalCostUsd)
}

/** Build Pareto data from non-C/O parts */
export function buildParetoData(vehicles: CoVehicle[] = CO_VEHICLES): ParetoEntry[] {
  const categories: ReasonCategory[] = ['design', 'spec_change', 'regulation', 'new_spec', 'shape_diff', 'performance']
  const counts = new Map<ReasonCategory, { count: number; cost: number }>()
  for (const cat of categories) counts.set(cat, { count: 0, cost: 0 })

  for (const v of vehicles) {
    for (const s of v.systems) {
      for (const p of s.subParts) {
        if (!p.isCo && p.reasonDetail) {
          const entry = counts.get(p.reasonDetail.categoryCode)!
          entry.count++
          entry.cost += p.reasonDetail.additionalCostUsd
        }
      }
    }
  }

  const data = [...counts.entries()]
    .map(([category, { count, cost }]) => ({ category, count, cost }))
    .sort((a, b) => b.count - a.count)

  const totalCount = data.reduce((s, d) => s + d.count, 0)
  let cumulative = 0
  return data.map(d => {
    cumulative += d.count
    return {
      ...d,
      ratio: totalCount ? Math.round((d.count / totalCount) * 100) : 0,
      cumPct: totalCount ? Math.round((cumulative / totalCount) * 100) : 0,
    }
  })
}

/** Overall stats */
export function getOverallStats(vehicles: CoVehicle[] = CO_VEHICLES) {
  let totalParts = 0, coParts = 0, totalCost = 0, savingsCost = 0
  for (const v of vehicles) {
    for (const s of v.systems) {
      for (const p of s.subParts) {
        totalParts++
        totalCost += p.materialCostUsd
        if (p.isCo) {
          coParts++
        } else if (p.reasonDetail) {
          savingsCost += p.reasonDetail.additionalCostUsd
        }
      }
    }
  }
  return {
    totalParts,
    coParts,
    nonCoParts: totalParts - coParts,
    coRate: totalParts > 0 ? Math.round((coParts / totalParts) * 100) : 0,
    totalCostUsd: totalCost,
    additionalCostUsd: savingsCost,
    vehicleCount: vehicles.length,
    systemCount: vehicles.reduce((s, v) => s + v.systems.length, 0),
  }
}
