import { useEffect, useState } from 'react'
import { Icon, type IconName } from './Icon'

type Theme = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'e-mirror.theme'
const NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' }
const LABEL: Record<Theme, string> = { system: 'Thème : système', light: 'Thème : clair', dark: 'Thème : sombre' }
const ICON: Record<Theme, IconName> = { system: 'contrast', light: 'sun', dark: 'moon' }

function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Stockage indisponible (navigation privée) : on suit le système.
  }
  return 'system'
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.dataset.theme = theme
    try {
      if (theme === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Sans stockage, le choix ne dure que le temps de la session.
    }
  }, [theme])

  return (
    <button
      type="button"
      onClick={() => setTheme(NEXT[theme])}
      aria-label={`${LABEL[theme]}. Changer de thème`}
      title={LABEL[theme]}
      className="grid size-11 flex-none place-items-center rounded-full border border-line bg-surface text-muted"
    >
      <Icon name={ICON[theme]} size={20} />
    </button>
  )
}
