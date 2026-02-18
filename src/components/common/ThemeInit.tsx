import { useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'

export function ThemeInit() {
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  return null
}
