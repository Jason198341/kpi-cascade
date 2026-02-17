import { useCascadeStore } from '@/stores/cascadeStore'

interface Props {
  nodeId: string
}

export function MiniTrace({ nodeId }: Props) {
  const getTrace = useCascadeStore((s) => s.getTrace)
  const trace = getTrace(nodeId)

  if (trace.length <= 1) return null

  // trace[0] is current node, trace[trace.length-1] is root
  const rootStep = trace[trace.length - 1]
  const impact = trace[0].cumulativeImpact * trace[0].progress

  return (
    <div className="mb-4 p-3 rounded-lg bg-trace/5 border border-trace/20">
      <div className="text-xs text-trace font-medium mb-2">✦ 기여 추적</div>
      <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
        {[...trace].reverse().map((step, i) => (
          <span key={step.node.id} className="flex items-center gap-1 shrink-0">
            {i > 0 && <span className="text-text-muted">→</span>}
            <span className="bg-surface-light px-1.5 py-0.5 rounded text-text-muted">
              {step.node.emoji} {Math.round(step.progress)}%
            </span>
          </span>
        ))}
      </div>
      <div className="mt-2 text-xs">
        <span className="text-text-muted">최상위 기여도: </span>
        <span className="text-trace font-mono font-bold">{impact.toFixed(1)}%</span>
      </div>
    </div>
  )
}
