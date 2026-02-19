import {
  getEffectiveProgress,
  getRootNodes,
  getNodesByDepth,
  getTeamRankingWithExpectation,
} from '@/lib/cascade'
import type { KpiNode, NodeMap, ChildrenMap, Profile, Depth } from '@/types'

// Emoji removal (consistent with PDF)
function clean(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0E}\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

const STATUS_KO: Record<string, string> = {
  active: '진행중',
  at_risk: '위험',
  completed: '완료',
  paused: '중단',
}

const STATUS_EN: Record<string, string> = {
  active: 'Active',
  at_risk: 'At Risk',
  completed: 'Done',
  paused: 'Paused',
}

function fmt(n: number): string {
  return `${Math.round(n)}%`
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function buildSingleLangEmail(
  nodes: KpiNode[],
  nodeMap: NodeMap,
  childrenMap: ChildrenMap,
  members: Profile[],
  orgName: string,
  lang: 'ko' | 'en',
): string {
  const isKo = lang === 'ko'
  const statusMap = isKo ? STATUS_KO : STATUS_EN
  const memberMap: Record<string, string> = {}
  for (const m of members) memberMap[m.id] = m.display_name

  const lines: string[] = []

  // Header
  lines.push(isKo ? '[KPI 캐스케이드 점검 보고서]' : '[KPI Cascade Inspection Report]')
  lines.push(`${isKo ? '날짜' : 'Date'}: ${today()}`)
  lines.push(`${isKo ? '조직' : 'Org'}: ${orgName}`)
  lines.push('')

  // Strategic goals
  lines.push(isKo ? '━━━ 전략 목표 현황 ━━━' : '━━━ Strategic Goals ━━━')
  const roots = getRootNodes(nodes)
  for (const r of roots) {
    const progress = getEffectiveProgress(r, nodeMap, childrenMap)
    lines.push(`${clean(r.title)} - ${fmt(progress)} (${statusMap[r.status] || r.status})`)
  }
  lines.push('')

  // Team KPIs (depth 1)
  const depth1 = getNodesByDepth(nodes, 1 as Depth)
  lines.push(isKo ? '━━━ 팀 KPI 현황 ━━━' : '━━━ Team KPIs ━━━')
  for (const kpi of depth1) {
    const progress = getEffectiveProgress(kpi, nodeMap, childrenMap)
    const parent = kpi.parent_id ? nodeMap[kpi.parent_id] : null
    const parentRef = parent ? ` (-> ${clean(parent.title)})` : ''
    lines.push(`  ${clean(kpi.title)} - ${fmt(progress)}${parentRef}`)
  }
  lines.push('')

  // Action details with milestones
  const actions = getNodesByDepth(nodes, 2 as Depth)
  lines.push(isKo ? '━━━ 액션 플랜 상세 ━━━' : '━━━ Action Plans ━━━')
  for (const a of actions) {
    const progress = getEffectiveProgress(a, nodeMap, childrenMap)
    const owner = a.owner_id ? (memberMap[a.owner_id] || '-') : '-'
    const period = (a.start_date || a.due_date)
      ? ` (${a.start_date || '?'} ~ ${a.due_date || '?'})`
      : ''
    lines.push(`${clean(a.title)} [${owner}] - ${fmt(progress)}${period}`)
    if (a.milestones && a.milestones.length > 0) {
      for (const ms of a.milestones) {
        const msDate = (ms.start_date || ms.end_date)
          ? ` (${ms.start_date || '?'}~${ms.end_date || '?'})`
          : ''
        lines.push(`   ${ms.done ? '[V]' : '[  ]'} ${ms.label}${msDate}`)
      }
    }
  }
  lines.push('')

  // At risk
  const atRisk = nodes.filter((n) => n.status === 'at_risk')
  lines.push(isKo ? '━━━ 위험 항목 ━━━' : '━━━ At Risk Items ━━━')
  if (atRisk.length === 0) {
    lines.push(isKo ? '(없음)' : '(None)')
  } else {
    for (const n of atRisk) {
      const progress = getEffectiveProgress(n, nodeMap, childrenMap)
      lines.push(`[!] ${clean(n.title)} - ${fmt(progress)} (${isKo ? '기한' : 'due'}: ${n.due_date || '-'})`)
    }
  }
  lines.push('')

  // Contribution ranking
  const ranking = getTeamRankingWithExpectation(nodes, nodeMap, childrenMap, members)
    .filter((r) => r.actionCount > 0)
  lines.push(isKo ? '━━━ 기여도 순위 ━━━' : '━━━ Contribution Ranking ━━━')
  ranking.forEach((r, i) => {
    lines.push(`${i + 1}. ${r.profile.display_name} (${r.profile.department || '-'}) - ${r.totalContribution.toFixed(1)}%`)
  })

  return lines.join('\n')
}

/** Generate BOTH KO and EN email text, concatenated with separator */
export function generateEmailText(
  nodes: KpiNode[],
  nodeMap: NodeMap,
  childrenMap: ChildrenMap,
  members: Profile[],
  orgName: string,
): string {
  const ko = buildSingleLangEmail(nodes, nodeMap, childrenMap, members, orgName, 'ko')
  const en = buildSingleLangEmail(nodes, nodeMap, childrenMap, members, orgName, 'en')
  return `${ko}\n\n${'='.repeat(60)}\n\n${en}`
}
