// Parts Commonization (공용화) types — hardcoded for prototyping

export type CoType = 'level1_co' | 'level2_co' | 'new_dev'
export type ReasonCategory = 'design' | 'spec_change' | 'regulation' | 'new_spec' | 'shape_diff' | 'performance'
export type CoPossibility = 'high' | 'medium' | 'low' | 'none'

export interface CoVehicle {
  code: string
  name: string
  stage: string
  sopDate: string
  half: 'H1' | 'H2'
  vehicleType: '양산' | '개발'
  salesVolume: number
  systems: CoSystem[]
}

export interface CoSystem {
  systemName: string
  systemPartNo: string
  coTypeCode: CoType
  baseVehicleCode: string
  subParts: CoSubPart[]
}

export interface CoSubPart {
  partName: string
  partNo: string
  isCo: boolean
  coSourceVehicle?: string
  coPartNo?: string
  supplier: string
  supplierRegion: string
  materialCostUsd: number
  reasonDetail?: CoReasonDetail
}

export interface CoReasonDetail {
  categoryCode: ReasonCategory
  baseSpec: string
  newSpec: string
  diffDescription: string
  designIntent: string
  impactArea: string
  coPossibility: CoPossibility
  coCondition?: string
  additionalCostUsd: number
}

// Derived summary types for views
export interface SystemSummary {
  vehicleCode: string
  vehicleName: string
  systemName: string
  coTypeCode: CoType
  baseVehicleCode: string
  totalSubParts: number
  coSubParts: number
  coRate: number
  coCostUsd: number
  newDevCostUsd: number
  savingsUsd: number
}

export interface OpportunityItem {
  vehicleCode: string
  vehicleName: string
  systemName: string
  partName: string
  partNo: string
  supplier: string
  materialCostUsd: number
  categoryCode: ReasonCategory
  coPossibility: CoPossibility
  coCondition?: string
  additionalCostUsd: number
  diffDescription: string
}

export interface ParetoEntry {
  category: ReasonCategory
  count: number
  cost: number
  ratio: number
  cumPct: number
}

export const CO_TYPE_LABELS: Record<CoType, { ko: string; en: string }> = {
  level1_co: { ko: '1레벨 C/O', en: 'Level 1 C/O' },
  level2_co: { ko: '2레벨 부분 C/O', en: 'Level 2 Partial' },
  new_dev: { ko: '신규개발', en: 'New Development' },
}

export const REASON_LABELS: Record<ReasonCategory, { ko: string; en: string }> = {
  design: { ko: '디자인', en: 'Design' },
  spec_change: { ko: '사양변경', en: 'Spec Change' },
  regulation: { ko: '법규', en: 'Regulation' },
  new_spec: { ko: '신규사양', en: 'New Spec' },
  shape_diff: { ko: '형상차이', en: 'Shape Diff' },
  performance: { ko: '성능', en: 'Performance' },
}

export const REASON_CATEGORIES: ReasonCategory[] = [
  'design', 'spec_change', 'regulation', 'new_spec', 'shape_diff', 'performance'
]

export const REASON_COLORS: Record<ReasonCategory, string> = {
  design: '#3182F6',
  spec_change: '#F97316',
  regulation: '#8B5CF6',
  new_spec: '#10B981',
  shape_diff: '#EF4444',
  performance: '#F59E0B',
}
