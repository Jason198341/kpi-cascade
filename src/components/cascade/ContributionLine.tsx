import { useMemo } from 'react'
import { useCascadeStore } from '@/stores/cascadeStore'

interface Props {
  parentId: string
  childId: string
  parentRef?: DOMRect
  childRef?: DOMRect
  containerRef?: DOMRect
}

export function ContributionLine({ parentId, childId, parentRef, childRef, containerRef }: Props) {
  const nodeMap = useCascadeStore((s) => s.nodeMap)
  const child = nodeMap[childId]

  const path = useMemo(() => {
    if (!parentRef || !childRef || !containerRef) return null

    const x1 = parentRef.left + parentRef.width / 2 - containerRef.left
    const y1 = parentRef.bottom - containerRef.top
    const x2 = childRef.left + childRef.width / 2 - containerRef.left
    const y2 = childRef.top - containerRef.top

    const midY = (y1 + y2) / 2
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
  }, [parentRef, childRef, containerRef])

  if (!path || !child) return null

  const depth = child.depth
  const color = `var(--color-depth-${depth})`

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={0.3}
      />
      {/* Weight label */}
      <text
        x={(parentRef!.left + parentRef!.width / 2 + childRef!.left + childRef!.width / 2) / 2 - containerRef!.left}
        y={(parentRef!.bottom + childRef!.top) / 2 - containerRef!.top}
        fill={color}
        fontSize={10}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        opacity={0.6}
      >
        ×{child.weight}
      </text>
    </g>
  )
}
