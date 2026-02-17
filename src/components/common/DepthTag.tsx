import type { Depth } from '@/types'
import { DEPTH_LABELS } from '@/types'

const depthClasses: Record<Depth, string> = {
  0: 'bg-depth-0/15 text-depth-0 border-depth-0/30',
  1: 'bg-depth-1/15 text-depth-1 border-depth-1/30',
  2: 'bg-depth-2/15 text-depth-2 border-depth-2/30',
}

export function DepthTag({ depth }: { depth: Depth }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${depthClasses[depth]}`}>
      {DEPTH_LABELS[depth].ko}
    </span>
  )
}
