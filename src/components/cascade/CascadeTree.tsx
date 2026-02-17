import { useMemo } from 'react'
import { useCascadeStore } from '@/stores/cascadeStore'
import { CascadeLane } from './CascadeLane'
import type { Depth } from '@/types'

export function CascadeTree() {
  const nodes = useCascadeStore((s) => s.nodes)
  const selectedNodeId = useCascadeStore((s) => s.selectedNodeId)
  const childrenMap = useCascadeStore((s) => s.childrenMap)
  const nodeMap = useCascadeStore((s) => s.nodeMap)

  // Filter nodes to show relevant subtree when a node is selected
  const filteredByDepth = useMemo(() => {
    const d0 = nodes.filter((n) => n.depth === 0).sort((a, b) => a.sort_order - b.sort_order)
    let d1 = nodes.filter((n) => n.depth === 1).sort((a, b) => a.sort_order - b.sort_order)
    let d2 = nodes.filter((n) => n.depth === 2).sort((a, b) => a.sort_order - b.sort_order)

    if (selectedNodeId) {
      const sel = nodeMap[selectedNodeId]
      if (sel) {
        if (sel.depth === 0) {
          const kids = childrenMap[sel.id] || []
          d1 = d1.filter((n) => kids.includes(n.id))
          const grandkidIds = kids.flatMap((k) => childrenMap[k] || [])
          d2 = d2.filter((n) => grandkidIds.includes(n.id))
        } else if (sel.depth === 1) {
          const kids = childrenMap[sel.id] || []
          d2 = d2.filter((n) => kids.includes(n.id))
        }
      }
    }

    return { d0, d1, d2 }
  }, [nodes, selectedNodeId, childrenMap, nodeMap])

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full overflow-auto p-3 md:p-4">
      <CascadeLane depth={0 as Depth} nodes={filteredByDepth.d0} />
      <CascadeLane depth={1 as Depth} nodes={filteredByDepth.d1} />
      <CascadeLane depth={2 as Depth} nodes={filteredByDepth.d2} />
    </div>
  )
}
