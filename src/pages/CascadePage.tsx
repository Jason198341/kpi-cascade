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
                {t('cascade.viewAll')}
              </Button>
            )}
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              + {t('depth.0')}
            </Button>
          </div>
        }
      />
      <div className="flex-1 flex overflow-hidden relative">
        {nodes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              emoji="🎯"
              title={t('cascade.noKpi')}
              description={t('cascade.noKpiDesc')}
              action={
                <Button onClick={() => setCreateOpen(true)}>{t('cascade.createStrategic')}</Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto">
              <CascadeTree />
            </div>
            {/* Mobile: overlay detail panel */}
            {selectedNodeId && (
              <>
                <div
                  className="fixed inset-0 bg-black/50 z-40 md:hidden"
                  onClick={() => selectNode(null)}
                />
                <div className="fixed inset-y-0 right-0 z-50 md:relative md:z-auto">
                  <NodeDetailPanel />
                </div>
              </>
            )}
          </>
        )}
      </div>
      <NodeFormModal open={createOpen} onClose={() => setCreateOpen(false)} depth={0} />
    </>
  )
}
