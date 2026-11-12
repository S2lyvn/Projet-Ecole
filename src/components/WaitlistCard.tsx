import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'

/** Page d'inscription à la file d'attente (systeme.io). Modifiable au build avec VITE_WAITLIST_URL. */
const WAITLIST_URL =
  import.meta.env.VITE_WAITLIST_URL ?? 'https://sullyvan-buatois-chichportich.systeme.io/vitrine#section-e628fc52'

const SEEN_KEY = 'deepin.waitlist.seen'
const DISMISSED_KEY = 'deepin.waitlist.dismissed'
/** L'invitation apparaît après la visite de 2 écrans différents : le visiteur a vu de quoi il s'agit. */
const SCREENS_BEFORE = 2

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* stockage bloqué : la carte reste simplement affichée */
  }
}

/** Invitation à rejoindre la file d'attente (page d'inscription systeme.io), proposée après la visite de la démo. */
export function WaitlistCard() {
  const { pathname } = useLocation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (read(DISMISSED_KEY) === '1') return
    const seen = new Set<string>(JSON.parse(read(SEEN_KEY) ?? '[]'))
    seen.add(pathname)
    write(SEEN_KEY, JSON.stringify([...seen]))
    if (seen.size >= SCREENS_BEFORE) setVisible(true)
  }, [pathname])

  if (!visible) return null

  return (
    <section
      aria-label="File d'attente"
      className="mt-2 flex flex-col gap-3 rounded-3xl border border-line bg-accent-tint p-4 text-accent-ink"
    >
      <div>
        <h2 className="font-display text-lg font-bold leading-tight">Tu aimes ? Sois prévenu·e du lancement.</h2>
        <p className="mt-1 text-[14px] leading-snug">
          Rejoins la file d’attente : un seul e-mail, le jour où DeepIN Armour ouvre. Pas de newsletter.
        </p>
      </div>
      <div className="flex gap-2">
        <a
          href={WAITLIST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl bg-accent px-4 text-[15px] font-bold text-on-accent no-underline"
        >
          Rejoindre la file d’attente
        </a>
        <button
          type="button"
          onClick={() => {
            write(DISMISSED_KEY, '1')
            setVisible(false)
          }}
          className="min-h-[48px] rounded-2xl px-3 text-[14px] font-medium"
        >
          Plus tard
        </button>
      </div>
    </section>
  )
}
