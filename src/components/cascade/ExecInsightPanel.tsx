import { useState, useRef, useCallback, useEffect } from 'react'
import { streamChat } from '@/lib/fireworks'
import { useCascadeStore } from '@/stores/cascadeStore'
import { useOrgStore } from '@/stores/orgStore'
import { useExecutiveStore } from '@/stores/executiveStore'
import { useUIStore } from '@/stores/uiStore'
import { buildMaps, getEffectiveProgress } from '@/lib/cascade'
import { daysUntil, isOverdue } from '@/lib/date'
import type { KpiNode, ExecutiveLog, Profile } from '@/types'

const EXEC_INSIGHT_SYSTEM = `You are an executive communication advisor for a fractal KPI management system.

## Your Role
Analyze KPI data, team structure, report/feedback status, and deadlines to provide actionable communication insights for executives.

## What You Analyze
- All KPI nodes (depth 0: strategic goals, depth 1: team KPIs, depth 2: action plans)
- Each node's progress, status, owner, due date
- Executive reporting history (plan/mid/result reports) and feedback rounds (1st/2nd/3rd)
- Team hierarchy and department structure

## What You Provide

### 1. Communication Strategy
- Who to contact for each at-risk or stalled KPI (team lead vs direct team member)
- When direct contact is more effective vs going through management chain
- Team relationship dynamics based on department and seniority

### 2. Report Timing
- Which KPIs need reporting NOW based on due dates and current status
- Recommended report schedule (plan → mid → result) timing
- Urgency flags for overdue or at-risk items

### 3. Feedback Timing
- Which items need feedback based on progress milestones
- Optimal timing for 1st/2nd/3rd feedback rounds
- Follow-up reminders for pending feedback

### 4. Overall Situation Assessment
- Project health summary with key risk indicators
- Cross-team dependencies and bottlenecks
- Recommended executive action items (prioritized)

## Guidelines
- Always respond in Korean
- Be specific — name actual KPIs, people, dates
- Use bullet points for clarity
- Prioritize urgency: overdue > at-risk > on-track
- Include "오늘 할 일" (today's action items) section
- Keep it concise but comprehensive
`

function buildInsightContext(
  nodes: KpiNode[],
  members: Profile[],
  logs: ExecutiveLog[],
): string {
  const today = new Date().toISOString().split('T')[0]
  const lines: string[] = [`기준일: ${today}\n`]
  const { nodeMap, childrenMap } = buildMaps(nodes)

  // Team members
  lines.push('## 팀원 구조')
  for (const m of members) {
    lines.push(`- ${m.display_name} (${m.role}, ${m.department || '미배정'}, 입사 ${m.hire_year || '?'}년)`)
  }
  lines.push('')

  // Nodes by depth
  for (const depth of [0, 1, 2] as const) {
    const label = depth === 0 ? '전략 목표' : depth === 1 ? '팀 KPI' : '액션 플랜'
    lines.push(`## ${label}`)
    const depthNodes = nodes.filter((n) => n.depth === depth)
    for (const n of depthNodes) {
      const progress = Math.round(getEffectiveProgress(n, nodeMap, childrenMap))
      const owner = n.owner_id ? members.find((m) => m.id === n.owner_id) : null
      const days = daysUntil(n.due_date)
      const overdue = isOverdue(n.due_date)
      const dueStr = n.due_date ? (overdue ? '기한초과' : `D-${days}`) : '마감일없음'

      lines.push(`- ${n.emoji} ${n.title}: ${progress}% (${n.status}) [${dueStr}]${owner ? ` 담당: ${owner.display_name}` : ''}`)

      // Exec logs for this node
      const nodeLogs = logs.filter((l) => l.node_id === n.id)
      if (nodeLogs.length > 0) {
        const reportDone = ['plan_report', 'mid_report', 'result_report']
          .map((t) => nodeLogs.find((l) => l.log_type === t))
          .map((l, i) => {
            const names = ['계획', '중간', '결과']
            return l?.done ? `${names[i]}✓(${l.done_at?.split('T')[0]})` : `${names[i]}○`
          })
        const fbDone = ['feedback_1', 'feedback_2', 'feedback_3']
          .map((t) => nodeLogs.find((l) => l.log_type === t))
          .map((l, i) => {
            if (!l?.done) return `${i + 1}차○`
            const memo = l.memo ? `: "${l.memo.slice(0, 30)}"` : ''
            return `${i + 1}차✓(${l.done_at?.split('T')[0]}${memo})`
          })
        lines.push(`  보고: ${reportDone.join(' | ')}`)
        lines.push(`  피드백: ${fbDone.join(' | ')}`)
      } else {
        lines.push(`  보고/피드백: 미기록`)
      }
    }
    lines.push('')
  }

  return lines.join('\n')
}

export function ExecInsightPanel() {
  const nodes = useCascadeStore((s) => s.nodes)
  const members = useOrgStore((s) => s.members)
  const logs = useExecutiveStore((s) => s.logs)
  const t = useUIStore((s) => s.t)

  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [content])

  const generate = useCallback(async () => {
    if (streaming) {
      abortRef.current?.abort()
      setStreaming(false)
      return
    }

    setOpen(true)
    setContent('')
    setStreaming(true)

    const context = buildInsightContext(nodes, members, logs)
    const messages: { role: 'system' | 'user'; content: string }[] = [
      { role: 'system', content: EXEC_INSIGHT_SYSTEM },
      { role: 'system', content: `현재 KPI 데이터:\n${context}` },
      { role: 'user', content: '전체 KPI 현황을 분석하고, 커뮤니케이션 전략, 보고 타이밍, 피드백 시기를 종합적으로 알려주세요. 담당자별 컨택 방식(팀장 경유 vs 직접)과 오늘 우선 할 일도 포함해주세요.' },
    ]

    const abort = new AbortController()
    abortRef.current = abort

    try {
      let accumulated = ''
      for await (const chunk of streamChat(messages, abort.signal)) {
        accumulated += chunk
        setContent(accumulated)
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setContent((prev) => prev + `\n\n오류: ${err}`)
      }
    } finally {
      setStreaming(false)
    }
  }, [nodes, members, logs, streaming])

  return (
    <div className="mb-3">
      {/* Trigger button */}
      <button
        onClick={generate}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
          streaming
            ? 'border-warning/50 bg-warning/10 text-warning'
            : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
        }`}
      >
        {streaming ? (
          <>
            <span className="animate-pulse">&#9632;</span>
            분석 중지
          </>
        ) : (
          <>
            <span>&#9889;</span>
            AI 커뮤니케이션 인사이트
          </>
        )}
      </button>

      {/* Streaming result */}
      {open && content && (
        <div
          ref={scrollRef}
          className="mt-2 border border-surface-border rounded-lg bg-surface/80 p-3 sm:p-4 max-h-[60vh] overflow-auto"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
              AI 인사이트
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-text-muted hover:text-text cursor-pointer"
            >
              닫기
            </button>
          </div>
          <div className="text-sm text-text leading-relaxed whitespace-pre-wrap">
            {content}
            {streaming && <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom" />}
          </div>
        </div>
      )}
    </div>
  )
}
