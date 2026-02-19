import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import {
  getEffectiveProgress,
  getRootNodes,
  getNodesByDepth,
} from '@/lib/cascade'
import type { KpiNode, NodeMap, ChildrenMap, Profile, Depth } from '@/types'

// ─── Helpers ────────────────────────────────────────────────
function clean(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0E}\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function fmt(n: number): string {
  return `${Math.round(n)}%`
}

const DEPTH_FILL: Record<number, string> = {
  0: 'D6BCFA', // purple light
  1: 'A5F3FC', // cyan light
  2: 'A7F3D0', // emerald light
  3: 'FEF3C7', // amber light (milestones)
}

const DEPTH_FONT: Record<number, string> = {
  0: '6D28D9',
  1: '0E7490',
  2: '047857',
  3: '92400E',
}

// ─── Action Plan sheet (like reference xlsx) ────────────────
function buildActionPlanSheet(
  wb: ExcelJS.Workbook,
  nodes: KpiNode[],
  nodeMap: NodeMap,
  childrenMap: ChildrenMap,
  members: Profile[],
  orgName: string,
  isKo: boolean,
) {
  const L = (ko: string, en: string) => isKo ? ko : en
  const ws = wb.addWorksheet(L('액션 플랜', 'Action Plan'))

  const memberMap: Record<string, string> = {}
  for (const m of members) memberMap[m.id] = m.display_name

  const sm: Record<string, string> = isKo
    ? { active: '진행중', at_risk: '위험', completed: '완료', paused: '중단' }
    : { active: 'Active', at_risk: 'At Risk', completed: 'Done', paused: 'Paused' }

  // Max milestones across all actions
  const maxMs = Math.max(
    7,
    ...nodes.filter((n) => n.depth === 2).map((n) => n.milestones?.length || 0),
  )

  // Title rows
  ws.mergeCells(1, 1, 1, 10 + maxMs)
  const titleCell = ws.getCell('A1')
  titleCell.value = `KPI Cascade - ${orgName}`
  titleCell.font = { bold: true, size: 14 }

  ws.mergeCells(2, 1, 2, 10 + maxMs)
  const dateCell = ws.getCell('A2')
  dateCell.value = `${L('날짜', 'Date')}: ${today()}`
  dateCell.font = { size: 10, color: { argb: '666666' } }

  // Headers (row 4)
  const headers = [
    'Lv',
    L('전략 목표', 'Strategic Goal'),
    'KPI',
    '#',
    L('액션 제목', 'Action Title'),
    L('설명', 'Description'),
    L('담당자', 'Owner'),
    L('상태', 'Status'),
    L('시작일', 'Start'),
    L('마감일', 'Due'),
  ]
  for (let i = 1; i <= maxMs; i++) headers.push(`MS${i}`)

  const headerRow = ws.getRow(4)
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '374151' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    }
  })

  // Column widths
  ws.getColumn(1).width = 5    // Lv
  ws.getColumn(2).width = 25   // Strategic
  ws.getColumn(3).width = 25   // KPI
  ws.getColumn(4).width = 4    // #
  ws.getColumn(5).width = 40   // Action Title
  ws.getColumn(6).width = 45   // Description
  ws.getColumn(7).width = 14   // Owner
  ws.getColumn(8).width = 10   // Status
  ws.getColumn(9).width = 12   // Start
  ws.getColumn(10).width = 12  // Due
  for (let i = 1; i <= maxMs; i++) ws.getColumn(10 + i).width = 40

  // Data rows
  let rowNum = 5
  let actionCounter = 0
  const roots = getRootNodes(nodes)

  for (const root of roots) {
    // D0 row
    const d0Row = ws.getRow(rowNum++)
    d0Row.getCell(1).value = 'D0'
    d0Row.getCell(2).value = clean(root.title)
    styleDepthRow(d0Row, 0, 10 + maxMs)

    // D1 children
    const d1Ids = childrenMap[root.id] || []
    for (const d1Id of d1Ids) {
      const kpi = nodeMap[d1Id]
      if (!kpi) continue
      const d1Actions = (childrenMap[d1Id] || []).length

      const d1Row = ws.getRow(rowNum++)
      d1Row.getCell(1).value = 'D1'
      d1Row.getCell(3).value = clean(kpi.title)
      d1Row.getCell(4).value = `${d1Actions} ${L('액션', 'actions')}`
      styleDepthRow(d1Row, 1, 10 + maxMs)

      // D2 children (actions)
      const d2Ids = childrenMap[d1Id] || []
      for (const d2Id of d2Ids) {
        const action = nodeMap[d2Id]
        if (!action) continue
        actionCounter++

        const d2Row = ws.getRow(rowNum++)
        d2Row.getCell(1).value = 'D2'
        d2Row.getCell(4).value = actionCounter
        d2Row.getCell(5).value = clean(action.title)
        d2Row.getCell(6).value = action.description ? clean(action.description) : ''
        d2Row.getCell(7).value = action.owner_id ? (memberMap[action.owner_id] || '-') : '-'
        d2Row.getCell(8).value = sm[action.status] || action.status
        d2Row.getCell(9).value = action.start_date || ''
        d2Row.getCell(10).value = action.due_date || ''

        // Milestones with dates
        if (action.milestones) {
          action.milestones.forEach((ms, mi) => {
            const datePart = (ms.start_date || ms.end_date)
              ? ` (${ms.start_date || '?'} ~ ${ms.end_date || '?'})`
              : ''
            d2Row.getCell(11 + mi).value = `${ms.done ? '[V]' : '[  ]'} ${ms.label}${datePart}`
          })
        }

        styleDepthRow(d2Row, 2, 10 + maxMs)
        d2Row.alignment = { wrapText: true, vertical: 'top' }
      }
    }
  }

  // Freeze panes
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }]
}

function styleDepthRow(row: ExcelJS.Row, depth: number, colCount: number) {
  const fill = DEPTH_FILL[depth] || 'FFFFFF'
  const fontColor = DEPTH_FONT[depth] || '000000'
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } }
    cell.font = { size: depth <= 1 ? 11 : 10, bold: depth <= 1, color: { argb: fontColor } }
    cell.border = {
      top: { style: 'thin', color: { argb: 'D1D5DB' } },
      bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
      left: { style: 'thin', color: { argb: 'D1D5DB' } },
      right: { style: 'thin', color: { argb: 'D1D5DB' } },
    }
  }
}

// ─── Gantt Chart sheet ──────────────────────────────────────
function buildGanttSheet(
  wb: ExcelJS.Workbook,
  nodes: KpiNode[],
  nodeMap: NodeMap,
  childrenMap: ChildrenMap,
  members: Profile[],
  isKo: boolean,
) {
  const L = (ko: string, en: string) => isKo ? ko : en
  const ws = wb.addWorksheet(L('간트 차트', 'Gantt Chart'))

  const memberMap: Record<string, string> = {}
  for (const m of members) memberMap[m.id] = m.display_name

  // Determine date range from all nodes
  const dates: Date[] = []
  for (const n of nodes) {
    if (n.start_date) dates.push(new Date(n.start_date))
    if (n.due_date) dates.push(new Date(n.due_date))
  }
  if (dates.length === 0) {
    dates.push(new Date())
    dates.push(new Date(new Date().getFullYear(), 11, 31))
  }

  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())))

  // Extend to start of week (Mon) and end of week (Sun)
  minDate.setDate(minDate.getDate() - ((minDate.getDay() + 6) % 7))
  maxDate.setDate(maxDate.getDate() + (7 - maxDate.getDay()) % 7)

  // Generate week columns
  const weeks: Date[] = []
  const cursor = new Date(minDate)
  while (cursor <= maxDate) {
    weeks.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 7)
  }

  const DATA_COLS = 5 // Lv, Item, Owner, Progress, Status
  const WEEK_START = DATA_COLS + 1

  // Header row 1: month labels (merged across weeks of same month)
  const monthRow = ws.getRow(1)
  let prevMonth = ''
  let mergeStart = WEEK_START
  for (let w = 0; w < weeks.length; w++) {
    const wk = weeks[w]
    const monthLabel = `${wk.getFullYear()}-${String(wk.getMonth() + 1).padStart(2, '0')}`
    const col = WEEK_START + w
    if (monthLabel !== prevMonth && prevMonth !== '') {
      if (col - 1 > mergeStart) {
        ws.mergeCells(1, mergeStart, 1, col - 1)
      }
      const mc = monthRow.getCell(mergeStart)
      mc.value = prevMonth
      mc.font = { bold: true, size: 9, color: { argb: 'FFFFFF' } }
      mc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F2937' } }
      mc.alignment = { horizontal: 'center' }
      mergeStart = col
    }
    prevMonth = monthLabel
  }
  // Last month
  if (WEEK_START + weeks.length - 1 >= mergeStart) {
    if (WEEK_START + weeks.length - 1 > mergeStart) {
      ws.mergeCells(1, mergeStart, 1, WEEK_START + weeks.length - 1)
    }
    const mc = monthRow.getCell(mergeStart)
    mc.value = prevMonth
    mc.font = { bold: true, size: 9, color: { argb: 'FFFFFF' } }
    mc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F2937' } }
    mc.alignment = { horizontal: 'center' }
  }

  // Header row 2: week dates
  const weekRow = ws.getRow(2)
  const dataHeaders = ['Lv', L('항목', 'Item'), L('담당', 'Owner'), '%', L('상태', 'Status')]
  dataHeaders.forEach((h, i) => {
    const cell = weekRow.getCell(i + 1)
    cell.value = h
    cell.font = { bold: true, size: 9, color: { argb: 'FFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '374151' } }
    cell.alignment = { horizontal: 'center' }
  })

  for (let w = 0; w < weeks.length; w++) {
    const col = WEEK_START + w
    const wk = weeks[w]
    const cell = weekRow.getCell(col)
    const d = wk.getDate()
    const m = wk.getMonth() + 1
    cell.value = `${m}/${d}`
    cell.font = { size: 8, color: { argb: 'FFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4B5563' } }
    cell.alignment = { horizontal: 'center' }
    ws.getColumn(col).width = 5
  }

  // Column widths for data
  ws.getColumn(1).width = 5    // Lv
  ws.getColumn(2).width = 35   // Item
  ws.getColumn(3).width = 12   // Owner
  ws.getColumn(4).width = 6    // %
  ws.getColumn(5).width = 8    // Status

  const sm: Record<string, string> = isKo
    ? { active: '진행중', at_risk: '위험', completed: '완료', paused: '중단' }
    : { active: 'Active', at_risk: 'At Risk', completed: 'Done', paused: 'Paused' }

  // Build flattened list: D0→D1→D2→milestones
  interface GanttRow {
    depth: number
    label: string
    owner: string
    progress: string
    status: string
    start: Date | null
    end: Date | null
  }

  const rows: GanttRow[] = []
  const roots = getRootNodes(nodes)

  function addNode(n: KpiNode) {
    const indent = '  '.repeat(n.depth)
    const prog = getEffectiveProgress(n, nodeMap, childrenMap)
    rows.push({
      depth: n.depth,
      label: `${indent}${clean(n.title)}`,
      owner: n.owner_id ? (memberMap[n.owner_id] || '-') : '-',
      progress: fmt(prog),
      status: sm[n.status] || n.status,
      start: n.start_date ? new Date(n.start_date) : null,
      end: n.due_date ? new Date(n.due_date) : null,
    })
    // Milestones for depth-2 (with dates for Gantt bars)
    if (n.depth === 2 && n.milestones && n.milestones.length > 0) {
      for (const ms of n.milestones) {
        rows.push({
          depth: 3,
          label: `      ${ms.done ? '[V]' : '[  ]'} ${ms.label}`,
          owner: '-',
          progress: ms.done ? '100%' : '0%',
          status: ms.done ? (sm['completed'] || 'Done') : '-',
          start: ms.start_date ? new Date(ms.start_date) : null,
          end: ms.end_date ? new Date(ms.end_date) : null,
        })
      }
    }
    for (const kidId of (childrenMap[n.id] || [])) {
      const kid = nodeMap[kidId]
      if (kid) addNode(kid)
    }
  }
  for (const root of roots) addNode(root)

  // Data rows
  let rowIdx = 3
  for (const r of rows) {
    const xlRow = ws.getRow(rowIdx)
    xlRow.getCell(1).value = `D${r.depth}`
    xlRow.getCell(2).value = r.label
    xlRow.getCell(3).value = r.owner
    xlRow.getCell(4).value = r.progress
    xlRow.getCell(5).value = r.status

    const fill = DEPTH_FILL[r.depth] || 'FFFFFF'
    const fontColor = DEPTH_FONT[r.depth] || '000000'

    // Style data cells
    for (let c = 1; c <= DATA_COLS; c++) {
      const cell = xlRow.getCell(c)
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } }
      cell.font = { size: r.depth <= 1 ? 10 : 9, bold: r.depth <= 1, color: { argb: fontColor } }
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
        right: { style: 'thin', color: { argb: 'E5E7EB' } },
      }
    }

    // Gantt bars
    if (r.start && r.end) {
      const barColor = {
        0: '8B5CF6',
        1: '06B6D4',
        2: '10B981',
        3: 'EAB308',
      }[r.depth] || '9CA3AF'

      for (let w = 0; w < weeks.length; w++) {
        const weekStart = weeks[w]
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)

        // Check if this week overlaps with the task's date range
        if (weekEnd >= r.start && weekStart <= r.end) {
          const cell = xlRow.getCell(WEEK_START + w)
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: barColor } }
        }
      }
    }

    rowIdx++
  }

  // Today marker — highlight the column for current week
  const now = new Date()
  for (let w = 0; w < weeks.length; w++) {
    const weekStart = weeks[w]
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    if (now >= weekStart && now <= weekEnd) {
      // Add a red bottom border to week header
      const hCell = weekRow.getCell(WEEK_START + w)
      hCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EF4444' } }
      hCell.font = { size: 8, bold: true, color: { argb: 'FFFFFF' } }
      break
    }
  }

  // Freeze panes
  ws.views = [{ state: 'frozen', xSplit: DATA_COLS, ySplit: 2 }]
}

// ─── Public API ─────────────────────────────────────────────
export type ExcelMode = 'actionplan' | 'gantt'

export async function generateExcel(
  nodes: KpiNode[],
  nodeMap: NodeMap,
  childrenMap: ChildrenMap,
  members: Profile[],
  orgName: string,
  lang: 'ko' | 'en',
  mode: ExcelMode,
): Promise<void> {
  const isKo = lang === 'ko'
  const wb = new ExcelJS.Workbook()

  if (mode === 'actionplan') {
    buildActionPlanSheet(wb, nodes, nodeMap, childrenMap, members, orgName, isKo)
  } else {
    buildGanttSheet(wb, nodes, nodeMap, childrenMap, members, isKo)
  }

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const suffix = mode === 'actionplan'
    ? (isKo ? '액션플랜' : 'ActionPlan')
    : (isKo ? '간트차트' : 'Gantt')
  saveAs(blob, `KPI_${suffix}_${today()}.xlsx`)
}
