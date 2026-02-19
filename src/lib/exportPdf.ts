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

// ─── Font ───────────────────────────────────────────────────
let fontCache: string | null = null

async function loadFont(): Promise<string> {
  if (fontCache) return fontCache
  const buf = await fetch('/fonts/NanumGothic-Regular.ttf').then((r) => r.arrayBuffer())
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  fontCache = btoa(bin)
  return fontCache
}

function setupFont(doc: jsPDF, b64: string) {
  doc.addFileToVFS('NanumGothic.ttf', b64)
  // Register same file for normal AND bold — prevents fallback to Helvetica
  doc.addFont('NanumGothic.ttf', 'Nanum', 'normal')
  doc.addFont('NanumGothic.ttf', 'Nanum', 'bold')
  doc.setFont('Nanum', 'normal')
}

// ─── Emoji removal (jsPDF cannot render bitmap emoji) ───────
function clean(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0E}\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// ─── Constants ──────────────────────────────────────────────
const DEPTH_BG: Record<number, [number, number, number]> = {
  0: [139, 92, 246],  // purple
  1: [6, 182, 212],   // cyan
  2: [16, 185, 129],  // emerald
  3: [234, 179, 8],   // amber (milestones)
}

function fmt(n: number): string {
  return `${Math.round(n)}%`
}
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── Shared autoTable styles (Korean font, no bold fallback) ──
const F = 'Nanum'
const baseStyles = { font: F, fontStyle: 'normal' as const, fontSize: 9, cellPadding: 3 }
const headBase = { ...baseStyles, fillColor: [60, 60, 60] as [number, number, number], textColor: 255 as const }

// ─── Tree builder (depth 0→1→2→3 milestones) ───────────────
interface TreeRow {
  depth: number       // 0/1/2/3
  label: string
  progress: string
  status: string
  weight: string
  owner: string
}

function buildTree(
  nodes: KpiNode[], nodeMap: NodeMap, childrenMap: ChildrenMap,
  members: Profile[], statusMap: Record<string, string>,
): TreeRow[] {
  const mMap: Record<string, string> = {}
  for (const m of members) mMap[m.id] = m.display_name

  const rows: TreeRow[] = []
  const roots = getRootNodes(nodes)

  function walk(nodeId: string) {
    const n = nodeMap[nodeId]
    if (!n) return
    const indent = '    '.repeat(n.depth)
    const progress = getEffectiveProgress(n, nodeMap, childrenMap)
    rows.push({
      depth: n.depth,
      label: `${indent}${clean(n.title)}`,
      progress: fmt(progress),
      status: statusMap[n.status] || n.status,
      weight: n.weight.toFixed(2),
      owner: n.owner_id ? (mMap[n.owner_id] || '-') : '-',
    })

    // Milestones as depth-3 rows under action plans
    if (n.depth === 2 && n.milestones && n.milestones.length > 0) {
      const msIndent = '    '.repeat(3)
      for (const ms of n.milestones) {
        rows.push({
          depth: 3,
          label: `${msIndent}${ms.done ? '[V]' : '[  ]'} ${ms.label}`,
          progress: ms.done ? '100%' : '0%',
          status: ms.done ? (statusMap['completed'] || 'Done') : '-',
          weight: '-',
          owner: '-',
        })
      }
    }

    for (const kid of (childrenMap[nodeId] || [])) walk(kid)
  }
  for (const root of roots) walk(root.id)
  return rows
}

// ─── Single-language PDF builder ────────────────────────────
async function buildSinglePDF(
  nodes: KpiNode[],
  nodeMap: NodeMap,
  childrenMap: ChildrenMap,
  members: Profile[],
  orgName: string,
  lang: 'ko' | 'en',
  b64: string,
): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  setupFont(doc, b64)

  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 14
  const CW = W - M * 2

  const mMap: Record<string, string> = {}
  for (const m of members) mMap[m.id] = m.display_name

  const isKo = lang === 'ko'
  const sm: Record<string, string> = isKo
    ? { active: '진행중', at_risk: '위험', completed: '완료', paused: '중단' }
    : { active: 'Active', at_risk: 'At Risk', completed: 'Done', paused: 'Paused' }
  const L = (ko: string, en: string) => isKo ? ko : en

  // ════════════ PAGE 1: COVER + SUMMARY ════════════════════

  doc.setFont(F, 'normal')
  doc.setFontSize(20)
  doc.setTextColor(139, 92, 246)
  doc.text(L('KPI 캐스케이드 종합 점검 보고서', 'KPI Cascade Inspection Report'), W / 2, 28, { align: 'center' })

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`${L('날짜', 'Date')}: ${today()}   |   ${L('조직', 'Org')}: ${orgName}`, W / 2, 38, { align: 'center' })

  // Strategic goals summary
  const roots = getRootNodes(nodes)
  doc.setFont(F, 'normal')
  doc.setFontSize(12)
  doc.setTextColor(50, 50, 50)
  doc.text(L('전략 목표 요약', 'Strategic Goals Summary'), M, 52)

  autoTable(doc, {
    startY: 56,
    head: [[L('전략 목표', 'Strategic Goal'), L('진행률', 'Progress'), L('상태', 'Status'), L('가중치', 'Weight')]],
    body: roots.map((r) => [
      clean(r.title),
      fmt(getEffectiveProgress(r, nodeMap, childrenMap)),
      sm[r.status] || r.status,
      r.weight.toFixed(2),
    ]),
    theme: 'grid',
    styles: baseStyles,
    headStyles: { ...headBase, fillColor: [139, 92, 246] },
    columnStyles: {
      0: { cellWidth: CW * 0.50 },
      1: { cellWidth: CW * 0.16, halign: 'center' },
      2: { cellWidth: CW * 0.17, halign: 'center' },
      3: { cellWidth: CW * 0.17, halign: 'center' },
    },
    margin: { left: M, right: M },
  })

  // Health score
  const counts = {
    active: nodes.filter((n) => n.status === 'active').length,
    at_risk: nodes.filter((n) => n.status === 'at_risk').length,
    completed: nodes.filter((n) => n.status === 'completed').length,
    paused: nodes.filter((n) => n.status === 'paused').length,
  }
  const total = nodes.length
  const pct = (v: number) => total ? fmt(v / total * 100) : '0%'

  const hY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  doc.setFont(F, 'normal')
  doc.setFontSize(12)
  doc.setTextColor(50, 50, 50)
  doc.text(L('조직 건강도', 'Org Health'), M, hY)

  autoTable(doc, {
    startY: hY + 4,
    head: [[L('상태', 'Status'), L('항목 수', 'Count'), L('비율', 'Ratio')]],
    body: [
      [L('진행중', 'Active'), String(counts.active), pct(counts.active)],
      [L('위험', 'At Risk'), String(counts.at_risk), pct(counts.at_risk)],
      [L('완료', 'Completed'), String(counts.completed), pct(counts.completed)],
      [L('중단', 'Paused'), String(counts.paused), pct(counts.paused)],
    ],
    theme: 'grid',
    styles: baseStyles,
    headStyles: headBase,
    margin: { left: M, right: M },
  })

  // ════════════ PAGE 2+: FULL TREE (depth 0→1→2→3) ════════

  doc.addPage()
  doc.setFont(F, 'normal')
  doc.setFontSize(12)
  doc.setTextColor(50, 50, 50)
  doc.text(L('전체 KPI 트리 + 마일스톤', 'Full KPI Tree + Milestones'), M, 14)

  const tree = buildTree(nodes, nodeMap, childrenMap, members, sm)
  const treeBody = tree.map((r) => [String(r.depth), r.label, r.progress, r.status, r.weight, r.owner])

  autoTable(doc, {
    startY: 18,
    head: [['D', L('항목', 'Item'), L('진행률', '%'), L('상태', 'Status'), L('가중치', 'Wt'), L('담당', 'Owner')]],
    body: treeBody,
    theme: 'grid',
    styles: { ...baseStyles, fontSize: 7.5, cellPadding: 2 },
    headStyles: { ...headBase, fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: CW * 0.46 },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
    },
    margin: { left: M, right: M },
    willDrawCell: (data) => {
      // Color the depth column cell
      if (data.section === 'body' && data.column.index === 0) {
        const d = Number(data.cell.raw)
        const bg = DEPTH_BG[d] || [200, 200, 200]
        data.cell.styles.fillColor = bg
        data.cell.styles.textColor = [255, 255, 255]
      }
      // Milestone rows: subtle background
      if (data.section === 'body') {
        const d = Number(treeBody[data.row.index]?.[0])
        if (d === 3 && data.column.index > 0) {
          data.cell.styles.fillColor = [250, 245, 230]
          data.cell.styles.textColor = [80, 70, 50]
          data.cell.styles.fontSize = 7
        }
      }
    },
    didDrawCell: (data) => {
      // Mini progress bar
      if (data.section === 'body' && data.column.index === 2) {
        const val = parseFloat(String(data.cell.raw).replace('%', '')) / 100
        if (isNaN(val)) return
        const bx = data.cell.x + 1
        const by = data.cell.y + data.cell.height - 2.5
        const bw = data.cell.width - 2
        doc.setFillColor(220, 220, 220)
        doc.rect(bx, by, bw, 1.2, 'F')
        const d = Number(treeBody[data.row.index]?.[0])
        const c = DEPTH_BG[d] || [100, 100, 100]
        doc.setFillColor(c[0], c[1], c[2])
        doc.rect(bx, by, bw * Math.min(val, 1), 1.2, 'F')
      }
    },
  })

  // ════════════ PAGE: ACTION DETAILS ═══════════════════════

  const actions = getNodesByDepth(nodes, 2 as Depth)
  if (actions.length > 0) {
    doc.addPage()
    doc.setFont(F, 'normal')
    doc.setFontSize(12)
    doc.setTextColor(50, 50, 50)
    doc.text(L('액션 플랜 상세', 'Action Plan Details'), M, 14)

    let y = 20
    for (const a of actions) {
      const prog = getEffectiveProgress(a, nodeMap, childrenMap)
      const own = a.owner_id ? (mMap[a.owner_id] || '-') : '-'
      const trace = getContributionTrace(a.id, nodeMap, childrenMap)
      const impact = trace.length > 1 ? trace[trace.length - 1].cumulativeImpact * 100 : 0
      const msCount = a.milestones?.length || 0
      const blockH = 20 + msCount * 4.5

      if (y + blockH > H - 14) { doc.addPage(); doc.setFont(F, 'normal'); y = 14 }

      doc.setFont(F, 'normal')
      doc.setFontSize(9)
      doc.setTextColor(16, 185, 129)
      doc.text(clean(a.title), M, y)
      y += 4

      doc.setFontSize(7.5)
      doc.setTextColor(90, 90, 90)
      doc.text(`${L('담당', 'Owner')}: ${own}  |  ${L('진행률', 'Progress')}: ${fmt(prog)}  |  ${L('상태', 'Status')}: ${sm[a.status] || a.status}  |  ${L('기여도', 'Impact')}: ${impact.toFixed(1)}%`, M + 2, y)
      y += 3.5
      doc.text(`${L('기간', 'Period')}: ${a.start_date || '-'} ~ ${a.due_date || '-'}`, M + 2, y)
      y += 4

      if (a.milestones && a.milestones.length > 0) {
        for (const ms of a.milestones) {
          if (y > H - 10) { doc.addPage(); doc.setFont(F, 'normal'); y = 14 }
          doc.setFontSize(7.5)
          doc.setTextColor(ms.done ? 16 : 140, ms.done ? 160 : 140, ms.done ? 110 : 140)
          doc.text(`    ${ms.done ? '[V]' : '[  ]'} ${ms.label}`, M + 2, y)
          y += 4
        }
      }

      y += 1.5
      doc.setDrawColor(210, 210, 210)
      doc.line(M, y, W - M, y)
      y += 4
    }
  }

  // ════════════ LAST PAGE: DASHBOARD SUMMARY ══════════════

  doc.addPage()
  doc.setFont(F, 'normal')
  doc.setFontSize(12)
  doc.setTextColor(50, 50, 50)
  doc.text(L('대시보드 요약', 'Dashboard Summary'), M, 14)

  // Contribution ranking
  const ranking = getTeamRankingWithExpectation(nodes, nodeMap, childrenMap, members)
    .filter((r) => r.actionCount > 0)

  doc.setFontSize(10)
  doc.text(L('기여도 순위', 'Contribution Ranking'), M, 22)

  autoTable(doc, {
    startY: 26,
    head: [['#', L('이름', 'Name'), L('부서', 'Dept'), L('기여도', 'Contrib'), L('액션', 'Actions'), L('기대대비', 'vs Exp')]],
    body: ranking.map((r, i) => [
      `${i + 1}`,
      r.profile.display_name,
      r.profile.department || '-',
      `${r.totalContribution.toFixed(1)}%`,
      String(r.actionCount),
      fmt(r.performanceRatio * 100),
    ]),
    theme: 'striped',
    styles: baseStyles,
    headStyles: { ...headBase, fillColor: [234, 179, 8], textColor: [30, 30, 30] },
    margin: { left: M, right: M },
  })

  // At risk
  const risks = nodes.filter((n) => n.status === 'at_risk')
  const rY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  doc.setFont(F, 'normal')
  doc.setFontSize(10)
  doc.setTextColor(50, 50, 50)
  doc.text(L('위험 항목', 'At Risk Items'), M, rY)

  if (risks.length === 0) {
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text(L('위험 항목 없음', 'No at-risk items'), M, rY + 6)
  } else {
    autoTable(doc, {
      startY: rY + 4,
      head: [[L('항목', 'Item'), L('진행률', '%'), L('기한', 'Due'), L('담당', 'Owner')]],
      body: risks.map((n) => [
        clean(n.title),
        fmt(getEffectiveProgress(n, nodeMap, childrenMap)),
        n.due_date || '-',
        n.owner_id ? (mMap[n.owner_id] || '-') : '-',
      ]),
      theme: 'grid',
      styles: baseStyles,
      headStyles: { ...headBase, fillColor: [220, 50, 50] },
      margin: { left: M, right: M },
    })
  }

  // ════════════ FOOTER ════════════════════════════════════

  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFont(F, 'normal')
    doc.setFontSize(7)
    doc.setTextColor(170, 170, 170)
    doc.text(`KPI Cascade - ${orgName} - ${today()}`, M, H - 6)
    doc.text(`${i} / ${pages}`, W - M, H - 6, { align: 'right' })
  }

  return doc
}

// ─── Main: generate BOTH KO and EN PDFs ─────────────────────
export async function generatePDF(
  nodes: KpiNode[],
  nodeMap: NodeMap,
  childrenMap: ChildrenMap,
  members: Profile[],
  orgName: string,
): Promise<void> {
  const b64 = await loadFont()
  const koDoc = await buildSinglePDF(nodes, nodeMap, childrenMap, members, orgName, 'ko', b64)
  koDoc.save(`KPI_Report_KO_${today()}.pdf`)
  const enDoc = await buildSinglePDF(nodes, nodeMap, childrenMap, members, orgName, 'en', b64)
  enDoc.save(`KPI_Report_EN_${today()}.pdf`)
}
