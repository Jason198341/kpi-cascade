import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { CascadeTree } from '@/components/cascade/CascadeTree'
import { NodeDetailPanel } from '@/components/cascade/NodeDetailPanel'
import { NodeFormModal } from '@/components/cascade/NodeFormModal'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { useCascadeStore } from '@/stores/cascadeStore'
import { useUIStore } from '@/stores/uiStore'

export default function CascadePage() {
  const nodes = useCascadeStore((s) => s.nodes)
  const selectedNodeId = useCascadeStore((s) => s.selectedNodeId)
  const selectNode = useCascadeStore((s) => s.selectNode)
  const t = useUIStore((s) => s.t)
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      <Header
        title={t('nav.cascade')}
        actions={
          <div className="flex gap-2">
            {selectedNodeId && (
              <Button variant="ghost" size="sm" onClick={() => selectNode(null)}>
                전체 보기
              </Button>
            )}
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              + {t('depth.0')}
            </Button>
          </div>
        }
      />
      <div className="flex-1 flex overflow-hidden">
        {nodes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              emoji="🎯"
              title="아직 KPI가 없습니다"
              description="첫 번째 전략 목표를 만들어 프랙탈 캐스케이드를 시작하세요"
              action={
                <Button onClick={() => setCreateOpen(true)}>+ 전략 목표 만들기</Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto">
              <CascadeTree />
            </div>
            {selectedNodeId && <NodeDetailPanel />}
          </>
        )}
      </div>
      <NodeFormModal open={createOpen} onClose={() => setCreateOpen(false)} depth={0} />
    </>
  )
}
