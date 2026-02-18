import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { TraceView } from '@/components/trace/TraceView'
import { Button } from '@/components/common/Button'
import { useUIStore } from '@/stores/uiStore'
import { useCascadeStore } from '@/stores/cascadeStore'

export default function TracePage() {
  const { nodeId } = useParams<{ nodeId: string }>()
  const navigate = useNavigate()
  const t = useUIStore((s) => s.t)
  const nodeMap = useCascadeStore((s) => s.nodeMap)

  const node = nodeId ? nodeMap[nodeId] : null

  return (
    <>
      <Header
        title={`${t('trace.title')} — ${node?.emoji || ''} ${node?.title || ''}`}
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            ← {t('trace.goBack')}
          </Button>
        }
      />
      <div className="flex-1 overflow-auto">
        {nodeId ? (
          <TraceView nodeId={nodeId} />
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted">
            {t('trace.selectNode')}
          </div>
        )}
      </div>
    </>
  )
}
