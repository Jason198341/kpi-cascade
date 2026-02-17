import { create } from 'zustand'
import { supabase, isDemoMode } from '@/lib/supabase'
import type { ExecLogType, ExecutiveLog } from '@/types'

const NOW = new Date().toISOString()

const DEMO_EXEC_LOGS: ExecutiveLog[] = [
  // s1 (매출 전략목표): 계획 보고 완료 + 1차 피드백
  { id: 'el-1', node_id: 's1', user_id: 'demo-user', log_type: 'plan_report', done: true, done_at: '2026-01-15T09:00:00Z', memo: null, created_at: NOW, updated_at: NOW },
  { id: 'el-2', node_id: 's1', user_id: 'demo-user', log_type: 'feedback_1', done: true, done_at: '2026-01-20T14:00:00Z', memo: '매출 목표 상향 조정 필요. Q2 집중 투자 결정.', created_at: NOW, updated_at: NOW },
  // t1 (영업팀 매출 성장): 계획+중간 보고 완료
  { id: 'el-3', node_id: 't1', user_id: 'demo-user', log_type: 'plan_report', done: true, done_at: '2026-01-18T10:00:00Z', memo: null, created_at: NOW, updated_at: NOW },
  { id: 'el-4', node_id: 't1', user_id: 'demo-user', log_type: 'mid_report', done: true, done_at: '2026-02-05T11:00:00Z', memo: null, created_at: NOW, updated_at: NOW },
  { id: 'el-5', node_id: 't1', user_id: 'demo-user', log_type: 'feedback_1', done: true, done_at: '2026-02-06T09:00:00Z', memo: '중간 실적 양호. 대형 고객 미팅 가속화 요청.', created_at: NOW, updated_at: NOW },
  // s2 (고객 유지율): 계획 보고만
  { id: 'el-6', node_id: 's2', user_id: 'demo-user', log_type: 'plan_report', done: true, done_at: '2026-01-16T10:00:00Z', memo: null, created_at: NOW, updated_at: NOW },
  // t4 (CS 만족도): 계획 보고 + 1차 피드백
  { id: 'el-7', node_id: 't4', user_id: 'demo-user', log_type: 'plan_report', done: true, done_at: '2026-01-22T09:00:00Z', memo: null, created_at: NOW, updated_at: NOW },
  { id: 'el-8', node_id: 't4', user_id: 'demo-user', log_type: 'feedback_1', done: true, done_at: '2026-01-25T14:00:00Z', memo: '응답 시간 개선 목표 1시간 이내로 확정.', created_at: NOW, updated_at: NOW },
]

interface ExecutiveState {
  logs: ExecutiveLog[]
  loading: boolean
  fetchLogs: (userId: string) => Promise<void>
  upsertLog: (nodeId: string, logType: ExecLogType, done: boolean, memo?: string | null) => Promise<void>
  getLogsForNode: (nodeId: string) => ExecutiveLog[]
}

export const useExecutiveStore = create<ExecutiveState>((set, get) => ({
  logs: [],
  loading: false,

  fetchLogs: async (userId) => {
    if (isDemoMode) {
      set({ logs: DEMO_EXEC_LOGS })
      return
    }
    set({ loading: true })
    const { data } = await supabase
      .from('executive_logs')
      .select('*')
      .eq('user_id', userId)
    set({ logs: (data as ExecutiveLog[]) || [], loading: false })
  },

  upsertLog: async (nodeId, logType, done, memo) => {
    const userId = isDemoMode ? 'demo-user' : undefined

    if (isDemoMode) {
      set((s) => {
        const existing = s.logs.find(
          (l) => l.node_id === nodeId && l.log_type === logType,
        )
        if (existing) {
          return {
            logs: s.logs.map((l) =>
              l.id === existing.id
                ? {
                    ...l,
                    done,
                    done_at: done ? new Date().toISOString() : null,
                    memo: memo !== undefined ? memo : l.memo,
                    updated_at: new Date().toISOString(),
                  }
                : l,
            ),
          }
        }
        const newLog: ExecutiveLog = {
          id: `el-${Date.now()}`,
          node_id: nodeId,
          user_id: userId!,
          log_type: logType,
          done,
          done_at: done ? new Date().toISOString() : null,
          memo: memo ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        return { logs: [...s.logs, newLog] }
      })
      return
    }

    // Live mode: Supabase upsert
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const row = {
      node_id: nodeId,
      user_id: user.id,
      log_type: logType,
      done,
      done_at: done ? new Date().toISOString() : null,
      memo: memo !== undefined ? memo : null,
    }

    const { data } = await supabase
      .from('executive_logs')
      .upsert(row, { onConflict: 'node_id,user_id,log_type' })
      .select()
      .single()

    if (data) {
      set((s) => {
        const idx = s.logs.findIndex(
          (l) => l.node_id === nodeId && l.log_type === logType,
        )
        if (idx >= 0) {
          const updated = [...s.logs]
          updated[idx] = data as ExecutiveLog
          return { logs: updated }
        }
        return { logs: [...s.logs, data as ExecutiveLog] }
      })
    }
  },

  getLogsForNode: (nodeId) => {
    return get().logs.filter((l) => l.node_id === nodeId)
  },
}))
