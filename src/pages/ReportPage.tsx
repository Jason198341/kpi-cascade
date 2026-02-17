import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { ProgressRing } from '@/components/common/ProgressRing'
import { useCascadeStore } from '@/stores/cascadeStore'
import { useOrgStore } from '@/stores/orgStore'
import { useExecutiveStore } from '@/stores/executiveStore'
import { useUIStore } from '@/stores/uiStore'
import { useCoachStore } from '@/stores/coachStore'
import { getPersonContribution } from '@/lib/cascade'
import { formatDate } from '@/lib/date'
import type { Profile, ExecLogType } from '@/types'

const REPORT_LABELS: Record<ExecLogType, string> = {
  plan_report: '계획 보고',
  mid_report: '중간 보고',
  result_report: '결과 보고',
  feedback_1: '1차 피드백',
  feedback_2: '2차 피드백',
  feedback_3: '3차 피드백',
}

export default function ReportPage() {
  const members = useOrgStore((s) => s.members)
  const { nodes, nodeMap, childrenMap } = useCascadeStore()
  const logs = useExecutiveStore((s) => s.logs)
  const t = useUIStore((s) => s.t)
  const sendMessage = useCoachStore((s) => s.sendMessage)
  const streaming = useCoachStore((s) => s.streaming)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [report, setReport] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const selectedMember = selectedId ? members.find((m) => m.id === selectedId) : null

  // Contributions for selected member
  const contributions = useMemo(() => {
    if (!selectedMember) return []
    return getPersonContribution(selectedMember.id, nodes, nodeMap, childrenMap)
  }, [selectedMember, nodes, nodeMap, childrenMap])

  const totalImpact = contributions.reduce((s, c) => s + c.impact, 0)

  // Feedback logs for selected member's nodes
  const memberLogs = useMemo(() => {
    if (!selectedMember) return []
    const nodeIds = new Set(contributions.map((c) => c.node.id))
    // Also include parent node logs
    nodes.forEach((n) => {
      if (n.depth === 0 || n.depth === 1) nodeIds.add(n.id)
    })
    return logs.filter((l) => nodeIds.has(l.node_id) && l.done)
  }, [selectedMember, contributions, logs, nodes])

  const aiAvailable = useCoachStore((s) => s.canUseAI)()

  const handleGenerate = async () => {
    if (!selectedMember || generating) return
    if (!aiAvailable) {
      setReport('오늘의 AI 사용 횟수(1회)를 모두 소진했습니다. 내일 다시 이용해 주세요.')
      return
    }
    setGenerating(true)
    setReport(null)

    // Build context for AI
    const lines: string[] = [
      `=== 연말 KPI 레포트 대상: ${selectedMember.display_name} ===`,
      `부서: ${selectedMember.department || '미지정'}`,
      `역할: ${selectedMember.role}`,
      `입사년도: ${selectedMember.hire_year || '미입력'}`,
      '',
      '--- 기여 활동 ---',
    ]

    contributions.forEach((c) => {
      lines.push(`[${c.node.emoji} ${c.node.title}] 진행률: ${Math.round(c.progress)}%, 기여도: ${c.impact.toFixed(1)}%, 가중치: ×${c.node.weight.toFixed(2)}`)
      if (c.node.milestones && c.node.milestones.length > 0) {
        const done = c.node.milestones.filter((m) => m.done).length
        lines.push(`  마일스톤: ${done}/${c.node.milestones.length} 완료`)
        c.node.milestones.forEach((m) => {
          lines.push(`  ${m.done ? '✓' : '○'} ${m.label}`)
        })
      }
    })

    lines.push('', '--- 보고/피드백 이력 ---')
    memberLogs.forEach((l) => {
      const nodeName = nodeMap[l.node_id]?.title || l.node_id
      lines.push(`[${nodeName}] ${REPORT_LABELS[l.log_type]}: ${l.done_at ? formatDate(l.done_at) : ''} ${l.memo ? `— "${l.memo}"` : ''}`)
    })

    lines.push('', `총 기여도: ${totalImpact.toFixed(1)}%`)

    const context = lines.join('\n')
    const prompt = `아래 데이터를 기반으로 ${selectedMember.display_name}의 연말 KPI 종합 레포트를 작성해주세요.

구성:
1. 종합 평가 (2-3문장)
2. 주요 기여 활동 분석 (각 액션별 성과와 의미)
3. 마일스톤 달성 현황
4. 피드백 이력 및 조치 사항
5. 성장 포인트 및 개선 제안
6. 내년도 제언

형식: 임원 보고용, 간결하고 데이터 기반.

${context}`

    try {
      // Use the coach's sendMessage to get AI response
      const messages = useCoachStore.getState().messages
      await sendMessage(prompt, context)
      // Get the last assistant message
      const updatedMessages = useCoachStore.getState().messages
      const lastMsg = updatedMessages.filter((m) => m.role === 'assistant').pop()
      setReport(lastMsg?.content || '레포트 생성에 실패했습니다.')
    } catch {
      setReport('AI 레포트 생성 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <Header title={t('report.title')} />
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Member selector */}
          <div className="glass rounded-xl p-4 sm:p-5 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-text-muted block mb-1.5">{t('report.selectMember')}</label>
                <select
                  value={selectedId || ''}
                  onChange={(e) => { setSelectedId(e.target.value || null); setReport(null) }}
                  className="w-full rounded-lg border border-surface-border bg-bg px-3 py-2.5 text-sm"
                >
                  <option value="">-- 선택 --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name} {m.department ? `(${m.department})` : ''} — {m.role}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={!selectedId || generating || streaming}
                className="shrink-0 self-end"
              >
                {generating || streaming ? t('report.generating') : t('report.generate')}
              </Button>
            </div>

            {!selectedId && (
              <p className="text-xs text-text-muted mt-3 leading-relaxed">
                {t('report.hint')}
              </p>
            )}
          </div>

          {/* Selected member summary */}
          <AnimatePresence mode="wait">
            {selectedMember && (
              <motion.div
                key={selectedMember.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Quick stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="glass rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold font-mono text-trace">{totalImpact.toFixed(1)}%</div>
                    <div className="text-[10px] text-text-muted mt-0.5">{t('people.contribution')}</div>
                  </div>
                  <div className="glass rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold font-mono text-depth-2">{contributions.length}</div>
                    <div className="text-[10px] text-text-muted mt-0.5">{t('people.actions')}</div>
                  </div>
                  <div className="glass rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold font-mono text-depth-0">
                      {memberLogs.filter((l) => l.log_type.includes('report')).length}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">{t('exec.reports')}</div>
                  </div>
                  <div className="glass rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold font-mono text-primary">
                      {memberLogs.filter((l) => l.log_type.includes('feedback')).length}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">{t('exec.feedback')}</div>
                  </div>
                </div>

                {/* Contributions detail */}
                <div className="glass rounded-xl p-4 sm:p-5">
                  <h3 className="text-sm font-semibold mb-3">{t('report.contributions')}</h3>
                  <div className="flex flex-col gap-2">
                    {contributions.map(({ node, progress, impact }) => (
                      <div key={node.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-light">
                        <ProgressRing progress={progress} depth={2} size={36} strokeWidth={3} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span>{node.emoji}</span>
                            <span className="text-sm font-medium truncate">{node.title}</span>
                          </div>
                          <div className="text-[10px] text-text-muted">
                            가중치 ×{node.weight.toFixed(2)} · 기여 {impact.toFixed(1)}%
                            {node.milestones && ` · 마일스톤 ${node.milestones.filter((m) => m.done).length}/${node.milestones.length}`}
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-depth-2">{Math.round(progress)}%</span>
                      </div>
                    ))}
                    {contributions.length === 0 && (
                      <p className="text-xs text-text-muted text-center py-4">배정된 액션이 없습니다</p>
                    )}
                  </div>
                </div>

                {/* Feedback history */}
                {memberLogs.length > 0 && (
                  <div className="glass rounded-xl p-4 sm:p-5">
                    <h3 className="text-sm font-semibold mb-3">{t('report.feedbackHistory')}</h3>
                    <div className="flex flex-col gap-1.5">
                      {memberLogs.map((log) => {
                        const nodeName = nodeMap[log.node_id]?.title || '—'
                        return (
                          <div key={log.id} className="flex items-start gap-2 text-xs p-2 rounded bg-surface-light">
                            <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium
                              ${log.log_type.includes('feedback') ? 'bg-primary/15 text-primary' : 'bg-depth-0/15 text-depth-0'}`}>
                              {REPORT_LABELS[log.log_type]}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="text-text-muted">{nodeName}</span>
                              {log.memo && <p className="text-text mt-0.5">"{log.memo}"</p>}
                            </div>
                            <span className="text-text-muted shrink-0 tabular-nums">
                              {log.done_at ? formatDate(log.done_at) : ''}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* AI Generated Report */}
                {report && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-4 sm:p-5 border border-trace/20"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">🤖</span>
                      <h3 className="text-sm font-semibold">{t('report.summary')}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-trace/15 text-trace ml-auto">AI Generated</span>
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap text-text/90">
                      {report}
                    </div>
                  </motion.div>
                )}

                {/* Empty state */}
                {!report && !generating && (
                  <div className="text-center py-8 text-text-muted text-sm">
                    <p>위 버튼을 눌러 AI 레포트를 생성하세요</p>
                    <p className="text-[10px] mt-1">기여도, 마일스톤, 피드백 이력을 종합 분석합니다</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* No member selected */}
          {!selectedMember && (
            <EmptyState
              emoji="📝"
              title={t('report.empty')}
              description={t('report.hint')}
            />
          )}
        </div>
      </div>
    </>
  )
}
