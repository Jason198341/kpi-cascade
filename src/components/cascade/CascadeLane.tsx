import { NodeCard } from './NodeCard'
import { DEPTH_LABELS, type Depth, type KpiNode } from '@/types'

interface Props {
  depth: Depth
  nodes: KpiNode[]
  highlightIds?: Set<string>
}

const depthBg: Record<Depth, string> = {
  0: 'bg-depth-0/5',
  1: 'bg-depth-1/5',
  2: 'bg-depth-2/5',
}

export function CascadeLane({ depth, nodes, highlightIds }: Props) {
  return (
    <div className={`flex-1 min-w-0 rounded-xl p-4 ${depthBg[depth]}`}>
      <div className="flex items-center gap-2 mb-4 px-1">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: `var(--color-depth-${depth})` }}
        />
        <h2 className="text-sm font-semibold" style={{ color: `var(--color-depth-${depth})` }}>
          {DEPTH_LABELS[depth].ko}
        </h2>
        <span className="text-xs text-text-muted ml-auto">{nodes.length}개</span>
      </div>
      <div className="flex flex-col gap-3 items-center">
        {nodes.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            showTrace={depth === 2}
          />
        ))}
      </div>
    </div>
  )
}
