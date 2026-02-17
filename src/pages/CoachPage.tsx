import { Header } from '@/components/layout/Header'
import { ChatPanel } from '@/components/coach/ChatPanel'
import { useUIStore } from '@/stores/uiStore'

export default function CoachPage() {
  const t = useUIStore((s) => s.t)

  return (
    <>
      <Header title={t('coach.title')} />
      <div className="flex-1 overflow-hidden">
        <ChatPanel />
      </div>
    </>
  )
}
