export type Depth = 0 | 1 | 2

export type NodeStatus = 'active' | 'at_risk' | 'completed' | 'paused'
export type Priority = 'low' | 'medium' | 'high' | 'critical'

export interface Milestone {
  id: string
  label: string
  done: boolean
}

export interface KpiNode {
  id: string
  org_id: string
  parent_id: string | null
  depth: Depth
  title: string
  description: string | null
  emoji: string
  owner_id: string | null
  target_value: number
  current_value: number
  unit: string
  weight: number
  status: NodeStatus
  priority: Priority
  start_date: string | null
  due_date: string | null
  milestones: Milestone[] | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  slug?: string
  owner_id: string
  report_stages: number
  feedback_rounds: number
  org_levels: OrgLevel[]
  created_at: string
}

export interface OrgLevel {
  name: string
  depth: number
}

export interface Profile {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  role: 'executive' | 'manager' | 'member'
  org_id: string | null
  department: string | null
  hire_year: number | null
  position_title: string | null
  onboarding_completed: boolean
  created_at: string
}

export interface ProgressLog {
  id: string
  node_id: string
  user_id: string
  previous_value: number
  new_value: number
  note: string | null
  created_at: string
}

export interface Comment {
  id: string
  node_id: string
  user_id: string
  body: string
  created_at: string
}

// Executive reporting/feedback
export type ExecLogType =
  | 'plan_report' | 'mid_report' | 'result_report'
  | 'feedback_1' | 'feedback_2' | 'feedback_3'

export interface ExecutiveLog {
  id: string
  node_id: string
  user_id: string
  log_type: ExecLogType
  done: boolean
  done_at: string | null
  memo: string | null
  created_at: string
  updated_at: string
}

export interface TraceStep {
  node: KpiNode
  progress: number
  weight: number
  normalizedWeight: number
  contribution: number
  cumulativeImpact: number
}

export interface NodeMap { [id: string]: KpiNode }
export interface ChildrenMap { [parentId: string]: string[] }

export const DEPTH_LABELS: Record<Depth, { ko: string; en: string }> = {
  0: { ko: '전략 목표', en: 'Strategic Goal' },
  1: { ko: '팀 KPI', en: 'Team KPI' },
  2: { ko: '액션 플랜', en: 'Action Plan' },
}

export const DEPTH_COLORS: Record<Depth, string> = {
  0: 'var(--color-depth-0)',
  1: 'var(--color-depth-1)',
  2: 'var(--color-depth-2)',
}
