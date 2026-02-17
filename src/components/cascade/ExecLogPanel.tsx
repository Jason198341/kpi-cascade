import { useState, useCallback, useEffect, useMemo } from 'react'
import { useExecutiveStore } from '@/stores/executiveStore'
import { useUIStore } from '@/stores/uiStore'
import type { ExecLogType, ExecutiveLog } from '@/types'

const REPORT_TYPES: { type: ExecLogType; key: string }[] = [
  { type: 'plan_report', key: 'exec.planReport' },
  { type: 'mid_report', key: 'exec.midReport' },
  { type: 'result_report', key: 'exec.resultReport' },
]

const FEEDBACK_TYPES: { type: ExecLogType; key: string }[] = [
  { type: 'feedback_1', key: 'exec.feedback1' },
  { type: 'feedback_2', key: 'exec.feedback2' },
  { type: 'feedback_3', key: 'exec.feedback3' },
]

function shortDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function CheckRow({
  log,
  label,
  logType,
  nodeId,
  showMemo,
}: {
  log: ExecutiveLog | undefined
  label: string
  logType: ExecLogType
  nodeId: string
  showMemo?: boolean
}) {
  const upsertLog = useExecutiveStore((s) => s.upsertLog)
  const [memo, setMemo] = useState(log?.memo ?? '')
  const [editing, setEditing] = useState(false)
  const done = log?.done ?? false

  // Sync memo state when log data changes externally
  useEffect(() => {
    if (!editing) {
      setMemo(log?.memo ?? '')
    }
  }, [log?.memo, editing])

  const toggle = useCallback(() => {
    upsertLog(nodeId, logType, !done, log?.memo)
  }, [nodeId, logType, done, log?.memo, upsertLog])

  const saveMemo = useCallback(() => {
    if (memo !== (log?.memo ?? '')) {
      upsertLog(nodeId, logType, done, memo || null)
    }
    setEditing(false)
  }, [nodeId, logType, done, memo, log?.memo, upsertLog])

  return (
    <div className="flex flex-col">
      <label className="flex items-center gap-2 py-0.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={done}
          onChange={toggle}
          className="accent-primary w-3.5 h-3.5 shrink-0 cursor-pointer"
        />
        <span className={`text-xs ${done ? 'text-text-muted line-through' : 'text-text'}`}>
          {label}
        </span>
        {done && log?.done_at && (
          <span className="text-[10px] text-text-muted ml-auto tabular-nums">
            {shortDate(log.done_at)}
          </span>
        )}
      </label>
      {showMemo && (
        <div className="ml-6">
          {editing ? (
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              onBlur={saveMemo}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveMemo() } }}
              autoFocus
              rows={2}
              className="w-full text-xs bg-transparent border border-surface-border rounded px-2 py-1 text-text resize-none focus:outline-none focus:border-primary"
              placeholder="피드백 내용..."
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-text-muted hover:text-text w-full text-left py-0.5 cursor-pointer truncate"
            >
              {log?.memo || '메모 입력...'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function ExecLogPanel({ nodeId }: { nodeId: string }) {
  // Subscribe to logs array directly — triggers re-render on any log change
  const logs = useExecutiveStore((s) => s.logs)
  const t = useUIStore((s) => s.t)

  const nodeLogs = useMemo(
    () => logs.filter((l) => l.node_id === nodeId),
    [logs, nodeId],
  )

  const findLog = (type: ExecLogType) => nodeLogs.find((l) => l.log_type === type)

  const reportDone = REPORT_TYPES.filter((r) => findLog(r.type)?.done).length
  const feedbackDone = FEEDBACK_TYPES.filter((f) => findLog(f.type)?.done).length

  return (
    <div className="mt-2 border border-surface-border rounded-lg bg-surface/50 divide-y divide-surface-border">
      {/* Reports row — compact horizontal */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
            {t('exec.reports')}
          </span>
          <span className="text-[10px] text-text-muted">{reportDone}/3</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {REPORT_TYPES.map((r) => (
            <CheckRow
              key={r.type}
              log={findLog(r.type)}
              label={t(r.key)}
              logType={r.type}
              nodeId={nodeId}
            />
          ))}
        </div>
      </div>

      {/* Feedback rows — vertical with memo */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
            {t('exec.feedback')}
          </span>
          <span className="text-[10px] text-text-muted">{feedbackDone}/3</span>
        </div>
        <div className="flex flex-col gap-0.5">
          {FEEDBACK_TYPES.map((f) => (
            <CheckRow
              key={f.type}
              log={findLog(f.type)}
              label={t(f.key)}
              logType={f.type}
              nodeId={nodeId}
              showMemo
            />
          ))}
        </div>
      </div>
    </div>
  )
}
