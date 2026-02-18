import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  getEffectiveProgress,
  getRootNodes,
  getNodesByDepth,
  getContributionTrace,
  getTeamRankingWithExpectation,
} from '@/lib/cascade'
import type { KpiNode, NodeMap, ChildrenMap, Profile, Depth } from '@/types'

// Depth colors (RGB) matching the app theme
const DEPTH_RGB: Record<Depth, [number, number, number]> = {
  0: [139, 92, 246],   // purple
  1: [6, 182, 212],    // cyan
  2: [16, 185, 129],   // emerald
}

const DEPTH_BG: Record<Depth, [number, number, number]> = {
  0: [139, 92, 246],
  1: [6, 182, 212],
  2: [16, 185, 129],
}

const STATUS_LABEL: Record<string, string> = {
  active: '진행중',
  at_risk: '위험',
  completed: '완료',
  paused: '중단',
}

function fmt(n: number): string {
  return `${Math.round(n)}%`
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Build indented tree rows by walking depth-first */
function buildTreeRows(
  nodes: KpiNode[],
  nodeMap: NodeMap,
  childrenMap: ChildrenMap,
  members: Profile[],
): string[][] {
  const memberMap: Record<string, string> = {}
  for (const m of members) memberMap[m.id] = m.display_name

  const rows: string[][] = []
  const roots = getRootNodes(nodes)

  function walk(nodeId: string, indent: number) {
    const node = nodeMap[nodeId]
    if (!node) return
    const prefix = '  '.repeat(indent)
    const progress = getEffectiveProgress(node, nodeMap, childrenMap)
    rows.push([
      String(node.depth),
      `${prefix}${node.emoji} ${node.title}`,
      fmt(progress),
      STATUS_LABEL[node.status] || node.status,
      node.weight.toFixed(2),
      node.owner_id ? (memberMap[node.owner_id] || '—') : '—',
    ])
    const kids = childrenMap[nodeId] || []
    for (const kid of kids) walk(kid, indent + 1)
  }

  for (const root of roots) walk(root.id, 0)
  return rows
}

/** Get parent path string: 💰 연 매출 → 📈 영업팀 → 📞 대형고객 */
function getPathString(node: KpiNode, nodeMap: NodeMap): string {
  const parts: string[] = []
  let cur: KpiNode | undefined = node
  while (cur) {
    parts.unshift(`${cur.emoji} ${cur.title}`)
    cur = cur.parent_id ? nodeMap[cur.parent_id] : undefined
  }
  return parts.join(' → ')
}

export function generatePDF(
  nodes: KpiNode[],
  nodeMap: NodeMap,
  childrenMap: ChildrenMap,
  members: Profile[],
  orgName: string,
  lang: 'ko' | 'en' = 'ko',
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentW = pageW - margin * 2

  const memberMap: Record<string, string> = {}
  for (const m of members) memberMap[m.id] = m.display_name

  const isKo = lang === 'ko'
  const title = isKo ? 'KPI 캐스케이드 종합 점검 보고서' : 'KPI Cascade Inspection Report'

  // ─── Page 1: Cover + Summary ───────────────────────────────

  // Title
  doc.setFontSize(22)
  doc.setTextColor(139, 92, 246)
  doc.text(title, pageW / 2, 30, { align: 'center' })

  // Metadata
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text(`${isKo ? '날짜' : 'Date'}: ${today()}`, margin, 42)
  doc.text(`${isKo ? '조직' : 'Org'}: ${orgName}`, margin, 48)

  // Strategic goals summary table
  const roots = getRootNodes(nodes)
  const summaryRows = roots.map((r) => {
    const progress = getEffectiveProgress(r, nodeMap, childrenMap)
    return [
      `${r.emoji} ${r.title}`,
      fmt(progress),
      STATUS_LABEL[r.status] || r.status,
      r.weight.toFixed(2),
    ]
  })

  doc.setFontSize(13)
  doc.setTextColor(50, 50, 50)
  doc.text(isKo ? '전략 목표 요약' : 'Strategic Goals Summary', margin, 60)

  autoTable(doc, {
    startY: 64,
    head: [[
      isKo ? '전략 목표' : 'Strategic Goal',
      isKo ? '진행률' : 'Progress',
      isKo ? '상태' : 'Status',
      isKo ? '가중치' : 'Weight',
    ]],
    body: summaryRows,
    theme: 'grid',
    headStyles: { fillColor: [139, 92, 246], textColor: 255, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: contentW * 0.50 },
      1: { cellWidth: contentW * 0.16, halign: 'center' },
      2: { cellWidth: contentW * 0.17, halign: 'center' },
      3: { cellWidth: contentW * 0.17, halign: 'center' },
    },
    margin: { left: margin, right: margin },
  })

  // Health score breakdown
  const active = nodes.filter((n) => n.status === 'active').length
  const atRisk = nodes.filter((n) => n.status === 'at_risk').length
  const completed = nodes.filter((n) => n.status === 'completed').length
  const paused = nodes.filter((n) => n.status === 'paused').length
  const total = nodes.length

  const healthY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  doc.setFontSize(13)
  doc.setTextColor(50, 50, 50)
  doc.text(isKo ? '조직 건강도' : 'Org Health Score', margin, healthY)

  autoTable(doc, {
    startY: healthY + 4,
    head: [[
      isKo ? '상태' : 'Status',
      isKo ? '항목 수' : 'Count',
      isKo ? '비율' : 'Ratio',
    ]],
    body: [
      [`🟢 ${isKo ? '진행중' : 'Active'}`, String(active), total ? fmt(active / total * 100) : '0%'],
      [`🔴 ${isKo ? '위험' : 'At Risk'}`, String(atRisk), total ? fmt(atRisk / total * 100) : '0%'],
      [`✅ ${isKo ? '완료' : 'Completed'}`, String(completed), total ? fmt(completed / total * 100) : '0%'],
      [`⏸️ ${isKo ? '중단' : 'Paused'}`, String(paused), total ? fmt(paused / total * 100) : '0%'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [80, 80, 80], textColor: 255, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: margin, right: margin },
  })

  // ─── Page 2: Full Tree Table ──────────────────────────────

  doc.addPage()
  doc.setFontSize(13)
  doc.setTextColor(50, 50, 50)
  doc.text(isKo ? '전체 KPI 트리' : 'Full KPI Tree', margin, 16)

  const treeRows = buildTreeRows(nodes, nodeMap, childrenMap, members)

  autoTable(doc, {
    startY: 20,
    head: [[
      'Depth',
      isKo ? '항목' : 'Item',
      isKo ? '진행률' : 'Progress',
      isKo ? '상태' : 'Status',
      isKo ? '가중치' : 'Weight',
      isKo ? '담당자' : 'Owner',
    ]],
    body: treeRows,
    theme: 'grid',
    headStyles: { fillColor: [60, 60, 60], textColor: 255, fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: contentW * 0.42 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
    },
    margin: { left: margin, right: margin },
    willDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        const depth = Number(data.cell.raw) as Depth
        const [r, g, b] = DEPTH_BG[depth] || [200, 200, 200]
        data.cell.styles.fillColor = [r, g, b]
        data.cell.styles.textColor = [255, 255, 255]
        data.cell.styles.fontStyle = 'bold'
      }
    },
    didDrawCell: (data) => {
      // Draw mini progress bar in the progress column
      if (data.section === 'body' && data.column.index === 2) {
        const rawText = String(data.cell.raw).replace('%', '')
        const pct = parseFloat(rawText) / 100
        if (isNaN(pct)) return
        const barX = data.cell.x + 1
        const barY = data.cell.y + data.cell.height - 3
        const barW = data.cell.width - 2
        const barH = 1.5
        // Background
        doc.setFillColor(220, 220, 220)
        doc.rect(barX, barY, barW, barH, 'F')
        // Fill
        const depth = Number(treeRows[data.row.index]?.[0]) as Depth
        const [r, g, b] = DEPTH_RGB[depth] || [100, 100, 100]
        doc.setFillColor(r, g, b)
        doc.rect(barX, barY, barW * Math.min(pct, 1), barH, 'F')
      }
    },
  })

  // ─── Page 3+: Action Details with Milestones ──────────────

  const actions = getNodesByDepth(nodes, 2 as Depth)
  if (actions.length > 0) {
    doc.addPage()
    doc.setFontSize(13)
    doc.setTextColor(50, 50, 50)
    doc.text(isKo ? '액션 플랜 상세' : 'Action Plan Details', margin, 16)

    let curY = 22

    for (const action of actions) {
      const progress = getEffectiveProgress(action, nodeMap, childrenMap)
      const owner = action.owner_id ? (memberMap[action.owner_id] || '—') : '—'
      const path = getPathString(action, nodeMap)
      const trace = getContributionTrace(action.id, nodeMap, childrenMap)
      const impact = trace.length > 1
        ? trace[trace.length - 1].cumulativeImpact * 100
        : 0

      // Estimate space needed
      const milestoneCount = action.milestones?.length || 0
      const blockHeight = 24 + milestoneCount * 5

      // Page break if needed
      if (curY + blockHeight > pageH - 15) {
        doc.addPage()
        curY = 16
      }

      // Action header
      doc.setFontSize(10)
      doc.setTextColor(16, 185, 129)
      doc.text(`${action.emoji} ${action.title}`, margin, curY)

      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      curY += 5
      doc.text(`${isKo ? '담당' : 'Owner'}: ${owner}  |  ${isKo ? '진행률' : 'Progress'}: ${fmt(progress)}  |  ${isKo ? '상태' : 'Status'}: ${STATUS_LABEL[action.status] || action.status}`, margin + 2, curY)
      curY += 4
      doc.text(`${isKo ? '기간' : 'Period'}: ${action.start_date || '—'} ~ ${action.due_date || '—'}  |  ${isKo ? '기여도' : 'Impact'}: ${impact.toFixed(1)}%`, margin + 2, curY)
      curY += 4

      // Path
      doc.setFontSize(7)
      doc.setTextColor(140, 140, 140)
      doc.text(path, margin + 2, curY)
      curY += 5

      // Milestones
      if (action.milestones && action.milestones.length > 0) {
        for (const ms of action.milestones) {
          if (curY > pageH - 12) {
            doc.addPage()
            curY = 16
          }
          const check = ms.done ? '✓' : '○'
          doc.setFontSize(8)
          doc.setTextColor(ms.done ? 16 : 150, ms.done ? 185 : 150, ms.done ? 129 : 150)
          doc.text(`  ${check} ${ms.label}`, margin + 4, curY)
          curY += 4.5
        }
      }

      // Separator line
      curY += 2
      doc.setDrawColor(220, 220, 220)
      doc.line(margin, curY, pageW - margin, curY)
      curY += 5
    }
  }

  // ─── Last Page: Dashboard Summary ─────────────────────────

  doc.addPage()
  doc.setFontSize(13)
  doc.setTextColor(50, 50, 50)
  doc.text(isKo ? '대시보드 요약' : 'Dashboard Summary', margin, 16)

  // Top Contributors
  const ranking = getTeamRankingWithExpectation(nodes, nodeMap, childrenMap, members)
  const rankRows = ranking
    .filter((r) => r.actionCount > 0)
    .map((r, i) => [
      `${i + 1}`,
      r.profile.display_name,
      r.profile.department || '—',
      `${r.totalContribution.toFixed(1)}%`,
      String(r.actionCount),
      fmt(r.performanceRatio * 100),
    ])

  doc.setFontSize(11)
  doc.setTextColor(50, 50, 50)
  doc.text(isKo ? '기여도 순위' : 'Contribution Ranking', margin, 24)

  autoTable(doc, {
    startY: 28,
    head: [[
      '#',
      isKo ? '이름' : 'Name',
      isKo ? '부서' : 'Dept',
      isKo ? '기여도' : 'Contribution',
      isKo ? '액션 수' : 'Actions',
      isKo ? '기대 대비' : 'vs Expected',
    ]],
    body: rankRows,
    theme: 'striped',
    headStyles: { fillColor: [251, 191, 36], textColor: [30, 30, 30], fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: margin, right: margin },
  })

  // At Risk items
  const atRiskNodes = nodes.filter((n) => n.status === 'at_risk')
  const atRiskY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  doc.setFontSize(11)
  doc.setTextColor(50, 50, 50)
  doc.text(isKo ? '위험 항목' : 'At Risk Items', margin, atRiskY)

  if (atRiskNodes.length === 0) {
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(isKo ? '위험 항목 없음' : 'No at-risk items', margin, atRiskY + 6)
  } else {
    const riskRows = atRiskNodes.map((n) => [
      `${n.emoji} ${n.title}`,
      fmt(getEffectiveProgress(n, nodeMap, childrenMap)),
      n.due_date || '—',
      n.owner_id ? (memberMap[n.owner_id] || '—') : '—',
    ])
    autoTable(doc, {
      startY: atRiskY + 4,
      head: [[
        isKo ? '항목' : 'Item',
        isKo ? '진행률' : 'Progress',
        isKo ? '기한' : 'Due',
        isKo ? '담당자' : 'Owner',
      ]],
      body: riskRows,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68], textColor: 255, fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    })
  }

  // Health breakdown
  const lastY = atRiskNodes.length > 0
    ? (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
    : atRiskY + 14

  doc.setFontSize(11)
  doc.setTextColor(50, 50, 50)
  doc.text(isKo ? '건강도 분포' : 'Health Breakdown', margin, lastY)

  autoTable(doc, {
    startY: lastY + 4,
    head: [['', isKo ? '항목 수' : 'Count', isKo ? '비율' : 'Ratio']],
    body: [
      ['🟢 Active', String(active), total ? fmt(active / total * 100) : '0%'],
      ['🔴 At Risk', String(atRisk), total ? fmt(atRisk / total * 100) : '0%'],
      ['✅ Completed', String(completed), total ? fmt(completed / total * 100) : '0%'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [80, 80, 80], textColor: 255, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: margin, right: margin },
  })

  // Footer on all pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(170, 170, 170)
    doc.text(`KPI Cascade — ${orgName} — ${today()}`, margin, pageH - 6)
    doc.text(`${i} / ${totalPages}`, pageW - margin, pageH - 6, { align: 'right' })
  }

  // Download
  const filename = isKo
    ? `KPI_점검보고서_${today()}.pdf`
    : `KPI_Inspection_Report_${today()}.pdf`
  doc.save(filename)
}
