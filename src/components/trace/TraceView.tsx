import { useMemo } from 'react'
import { useCascadeStore } from '@/stores/cascadeStore'
import { TraceStepCard } from './TraceStep'
import { ImpactMeter } from './ImpactMeter'
import { TraceParticles } from './TraceParticles'

interface Props {
  nodeId: string
}

export function TraceView({ nodeId }: Props) {
  const getTrace = useCascadeStore((s) => s.getTrace)

  const trace = useMemo(() => getTrace(nodeId), [nodeId, getTrace])

  if (trace.length === 0) return null

  // trace[0] = leaf (current), trace[last] = root
  const leafStep = trace[0]
  const finalImpact = leafStep.cumulativeImpact * leafStep.progress

  // Reverse for display: root at top → leaf at bottom
  const displaySteps = [...trace].reverse()

  const rootTitle = displaySteps[0]?.node.title ?? ''
  const leafTitle = displaySteps[displaySteps.length - 1]?.node.title ?? ''

  return (
    <div
      className="max-w-xl mx-auto py-8 px-4 relative"
      aria-label={`기여도 추적: ${leafTitle}에서 ${rootTitle}까지의 연결 고리 (${displaySteps.length}단계, 최종 기여도 ${Math.round(finalImpact * 100)}%p)`}
    >
      {/* Impact meter at top */}
      <ImpactMeter impact={finalImpact} />

      {/* Trace steps (top = root, bottom = leaf) */}
      <div className="relative mt-10 flex flex-col gap-10">
        <TraceParticles height={displaySteps.length * 160} />
        {displaySteps.map((step, i) => (
          <TraceStepCard
            key={step.node.id}
            step={step}
            index={i}
            total={displaySteps.length}
            isLeaf={i === displaySteps.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
