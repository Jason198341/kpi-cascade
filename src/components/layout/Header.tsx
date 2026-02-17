import { useUIStore } from '@/stores/uiStore'

interface Props {
  title: string
  actions?: React.ReactNode
}

export function Header({ title, actions }: Props) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const lang = useUIStore((s) => s.lang)
  const setLang = useUIStore((s) => s.setLang)

  return (
    <header className="h-14 border-b border-surface-border flex items-center justify-between px-6 shrink-0 bg-surface/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="text-text-muted hover:text-text p-1 cursor-pointer md:hidden"
        >
          ☰
        </button>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
          className="text-xs text-text-muted hover:text-text px-2 py-1 rounded border border-surface-border cursor-pointer"
        >
          {lang === 'ko' ? 'EN' : 'KO'}
        </button>
        {actions}
      </div>
    </header>
  )
}
