import { useCoachStore } from '@/stores/coachStore'
import { useCascadeStore } from '@/stores/cascadeStore'

export function NodeContextBadge() {
  const contextNodeId = useCoachStore((s) => s.contextNodeId)
  const setContextNode = useCoachStore((s) => s.setContextNode)
  const nodeMap = useCascadeStore((s) => s.nodeMap)

  const node = contextNodeId ? nodeMap[contextNodeId] : null
  if (!node) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-lg border border-accent/20">
      <span className="text-sm">{node.emoji}</span>
      <span className="text-xs text-accent">{node.title}</span>
      <button
        onClick={() => setContextNode(null)}
        className="text-accent/50 hover:text-accent text-xs ml-1 cursor-pointer"
      >
        ✕
      </button>
    </div>
  )
}
