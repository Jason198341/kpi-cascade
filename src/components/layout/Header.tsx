import { useUIStore } from '@/stores/uiStore'

interface Props {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, actions }: Props) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const lang = useUIStore((s) => s.lang)
  const setLang = useUIStore((s) => s.setLang)

  return (
    <header className="h-14 border-b border-surface-border flex items-center justify-between px-6 shrink-0 bg-surface/70 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="text-text-muted hover:text-text p-1.5 cursor-pointer md:hidden rounded-md hover:bg-surface-light transition-colors"
        >
          ☰
        </button>
        <div>
          <h1 className="text-lg font-semibold leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
          className="text-xs font-medium text-text-muted hover:text-text px-2.5 py-1 rounded-md border border-surface-border hover:border-text-muted/30 cursor-pointer transition-colors"
        >
          {lang === 'ko' ? 'EN' : 'KO'}
        </button>
        {actions}
      </div>
    </header>
  )
}
