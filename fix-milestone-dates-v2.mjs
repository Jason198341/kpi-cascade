// Fix milestone dates: strict Gantt-chart sequential (no gaps, no overlaps)
// Each milestone starts the day after the previous one ends.
// Total range = node.start_date ~ node.due_date, split evenly across milestones.
const URL = 'https://rcdflbygcjmrmcwrhpqm.supabase.co/rest/v1/kpi_nodes'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjZGZsYnlnY2ptcm1jd3JocHFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMzMDI4NSwiZXhwIjoyMDg2OTA2Mjg1fQ.***REMOVED***'

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function daysBetween(a, b) {
  const da = new Date(a + 'T00:00:00Z')
  const db = new Date(b + 'T00:00:00Z')
  return Math.round((db - da) / 86400000)
}

function distributeGantt(milestones, startDate, dueDate) {
  const n = milestones.length
  if (n === 0) return milestones
  const totalDays = daysBetween(startDate, dueDate)
  if (totalDays <= 0) {
    // Single day — all milestones get the same day
    return milestones.map(m => ({ ...m, start_date: startDate, end_date: dueDate }))
  }

  const baseDays = Math.floor(totalDays / n)
  const remainder = totalDays % n

  let cursor = startDate
  return milestones.map((m, i) => {
    const mStart = cursor
    // Give extra days to earlier milestones when there's remainder
    const duration = baseDays + (i < remainder ? 1 : 0)
    const mEnd = addDays(mStart, duration - 1)  // -1 because start day counts
    cursor = addDays(mEnd, 1) // next milestone starts the day after
    return { ...m, start_date: mStart, end_date: mEnd }
  })
}

async function main() {
  // Fetch all depth-2 nodes with milestones
  const res = await fetch(
    `${URL}?depth=eq.2&select=id,title,start_date,due_date,milestones`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }
  )
  const nodes = await res.json()

  let updated = 0
  for (const node of nodes) {
    if (!node.milestones || node.milestones.length === 0) continue
    if (!node.start_date || !node.due_date) {
      console.log(`  SKIP ${node.id.slice(0, 8)} — no start/due date`)
      continue
    }

    const fixed = distributeGantt(node.milestones, node.start_date, node.due_date)

    // Patch
    const pRes = await fetch(`${URL}?id=eq.${node.id}`, {
      method: 'PATCH',
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ milestones: fixed }),
    })

    if (pRes.ok) {
      const ms = fixed
      console.log(`  OK ${node.id.slice(0, 8)} "${node.title.slice(0, 30)}" (${ms.length} milestones, ${node.start_date}~${node.due_date})`)
      // Print each milestone's date range
      for (const m of ms) {
        console.log(`     ${m.start_date} ~ ${m.end_date} | ${m.done ? '✓' : '○'} ${m.label.slice(0, 50)}`)
      }
      updated++
    } else {
      console.error(`  FAIL ${node.id.slice(0, 8)}: ${pRes.status}`)
    }
  }
  console.log(`\nDone: ${updated} nodes updated with Gantt-sequential dates.`)
}

main()
