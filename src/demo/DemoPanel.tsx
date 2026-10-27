// Panneau de démonstration (soutenance) : jour simulé, mode miroir, réinitialisation, phrase d'aide.
// Grand écran : panneau à côté du cadre de l'appli. Petit écran : bouton flottant « Démo » et feuille du bas.
import { useId, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { isSecondaryPath } from '../app/navigation'
import { ME } from '../domain/swaps'
import { formatLongDate } from '../app/format'
import { useActiveGarments, useWardrobe } from '../app/WardrobeProvider'
import { BottomSheet } from '../components/BottomSheet'
import { Button, IconButton } from '../components/Button'
import { Icon } from '../components/Icon'
import { useToast } from '../components/Toast'
import { buildOutfit, outfitGarmentIds } from '../domain/outfit'
import { plural } from '../domain/wording'
import { demoHint } from './hint'

/** Même seuil que le préfixe lg: de Tailwind. */
const WIDE_QUERY = '(min-width: 64rem)'

function subscribeWide(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => {}
  const query = window.matchMedia(WIDE_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

// Sans matchMedia (tests), on affiche le panneau latéral.
function isWide(): boolean {
  return typeof window.matchMedia !== 'function' || window.matchMedia(WIDE_QUERY).matches
}


export function DemoPanel() {
  const { demo } = useWardrobe()
  const wide = useSyncExternalStore(subscribeWide, isWide, () => true)
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  if (!demo) return null

  if (wide) {
    return (
      <aside
        aria-labelledby={titleId}
        className="flex w-full max-w-[360px] min-w-0 flex-[1_1_300px] flex-col gap-[18px] py-2 text-ink"
      >
        <DemoContent titleId={titleId} />
      </aside>
    )
  }

  // Petit écran : bouton flottant en bas à droite, au-dessus de la barre d'onglets (AppLayout réserve la place).
  // Masqué sur les écrans secondaires, où il passerait par-dessus le contenu qui défile : la démo reste à un retour.
  if (isSecondaryPath(pathname)) return null
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={`fixed right-3 bottom-[calc(104px+env(safe-area-inset-bottom))] z-10 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-outline bg-surface px-4 text-sm font-bold text-ink`}
      >
        <Icon name="play" size={16} />
        Démo
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} labelledBy={titleId}>
        <DemoContent titleId={titleId} onClose={() => setOpen(false)} />
      </BottomSheet>
    </>
  )
}

const BLOCK_CLASSES = 'flex flex-col gap-2.5 border-t border-line pt-4'
const BLOCK_TITLE_CLASSES = 'm-0 text-[13px] font-bold tracking-[0.06em] text-muted uppercase'
const SMALL_CLASSES = 'm-0 text-[13px] text-pretty text-muted'

/** Contenu commun au panneau et à la feuille. onClose : fermer la feuille après une action (petit écran). */
function DemoContent({ titleId, onClose }: { titleId: string; onClose?: () => void }) {
  const { data, demo, run } = useWardrobe()
  const garments = useActiveGarments()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const busy = useRef(false)
  const ids = useId()
  const { today, dailyOutfit, pending, purchases, settings } = data

  const outfit = useMemo(
    () => buildOutfit(garments, today, dailyOutfit.orphanId),
    [garments, today, dailyOutfit.orphanId],
  )

  // Comme Aujourd'hui : seules les pièces encore dans le dressing sont à confirmer.
  const pendingCount = useMemo(() => {
    if (!pending) return 0
    const activeIds = new Set(garments.map((g) => g.id))
    return pending.garmentIds.filter((id) => activeIds.has(id)).length
  }, [pending, garments])

  const hint = demoHint({
    path: pathname,
    pendingCount,
    outfitStatus: dailyOutfit.status,
    hasOutfit: outfit !== null,
    mirrorMode: settings.mirrorMode,
    purchasesCount: purchases.length,
  })

  /**
   * Quitte l'écran courant pour Aujourd'hui avant de changer les données. Depuis un écran secondaire, la mise
   * en page est remontée (autre cadre) et ne donne pas le focus au titre : on le fait à la main.
   */
  function goHome() {
    if (pathname === '/') return
    const fromSecondary = isSecondaryPath(pathname)
    navigate('/')
    if (fromSecondary) requestAnimationFrame(() => document.getElementById('screen-title')?.focus())
  }

  async function guarded(action: () => Promise<void>) {
    if (busy.current) return
    busy.current = true
    try {
      await action()
    } catch {
      showToast('Impossible pour le moment. Réessaie.')
    } finally {
      busy.current = false
    }
  }

  const advance = () =>
    guarded(async () => {
      if (!demo) return
      // Pièces que le miroir va détecter : à compter avant d'avancer (nextDay() du prototype).
      const detected =
        settings.mirrorMode && dailyOutfit.status === 'validated' && outfit ? outfitGarmentIds(outfit).length : 0
      if (isSecondaryPath(pathname)) goHome()
      const next = await run(() => demo.advanceDay())
      onClose?.()
      const date = `${formatLongDate(next)}.`
      showToast(
        detected > 0 ? `Miroir : ${detected} ${plural(detected, 'pièce détectée', 'pièces détectées')}. ${date}` : date,
      )
    })

  const reset = () =>
    guarded(async () => {
      if (!demo) return
      goHome()
      await run(() => demo.reset())
      onClose?.()
      showToast('Démo réinitialisée.')
    })

  // Bourse simulée : un membre fictif réserve la première annonce ouverte de l'utilisateur.
  const myOpenListings = data.swaps.listings.filter((l) => l.ownerId === ME && l.status === 'open').length
  const simulateReservation = () =>
    guarded(async () => {
      if (!demo) return
      try {
        const swap = await run(() => demo.simulateIncomingReservation())
        onClose?.()
        const member = data.swaps.members.find((m) => m.id === swap.receiverId)
        navigate(`/echanges/echange/${swap.id}`)
        showToast(`${member?.displayName ?? 'Un membre'} veut ta pièce !`)
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'Impossible pour le moment.')
      }
    })

  const toggleMirror = () =>
    guarded(async () => {
      const mirrorMode = !settings.mirrorMode
      await run((r) => r.updateSettings({ mirrorMode }))
      showToast(mirrorMode ? 'Mode miroir activé.' : 'Mode miroir désactivé.')
    })

  const dayId = `${ids}-day`
  const mirrorId = `${ids}-mirror`
  const mirrorLabelId = `${ids}-mirror-label`
  const mirrorNoteId = `${ids}-mirror-note`
  const nextId = `${ids}-next`
  const swapId = `${ids}-swap`

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="m-0 text-xs font-bold tracking-[0.08em] text-muted uppercase">Démo</p>
          <h2
            id={titleId}
            className="m-0 font-display text-[27px] leading-[1.1] font-bold tracking-[-0.015em] text-balance"
          >
            Un dressing qui se met à jour tout seul
          </h2>
        </div>
        {onClose && (
          <IconButton label="Fermer" onClick={onClose}>
            <Icon name="close" size={22} strokeWidth={2} />
          </IconButton>
        )}
      </div>

      <section className={BLOCK_CLASSES} aria-labelledby={dayId}>
        <h3 id={dayId} className={BLOCK_TITLE_CLASSES}>
          Jour simulé
        </h3>
        <p className="m-0 font-display text-[21px] leading-[1.15] font-semibold">{formatLongDate(today)}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" fullWidth={false} className="flex-[1_1_auto]" onClick={() => void advance()}>
            Avancer d’un jour
          </Button>
          <Button fullWidth={false} className="flex-[1_1_auto]" onClick={() => void reset()}>
            Réinitialiser
          </Button>
        </div>
      </section>

      <section className={BLOCK_CLASSES} aria-labelledby={mirrorId}>
        <h3 id={mirrorId} className={BLOCK_TITLE_CLASSES}>
          Mode miroir
        </h3>
        <button
          type="button"
          role="switch"
          aria-checked={settings.mirrorMode}
          aria-labelledby={`${mirrorId} ${mirrorLabelId}`}
          aria-describedby={mirrorNoteId}
          onClick={() => void toggleMirror()}
          className="flex min-h-12 w-full items-center justify-between gap-3 pr-1 text-left text-[15px] font-medium text-ink"
        >
          <span id={mirrorLabelId}>Détection automatique de la tenue</span>
          <span
            aria-hidden="true"
            className={[
              'relative h-7 w-12 flex-none rounded-full motion-safe:transition-colors',
              settings.mirrorMode ? 'bg-accent' : 'bg-outline',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-[3px] left-[3px] size-[22px] rounded-full bg-surface motion-safe:transition-transform',
                settings.mirrorMode ? 'translate-x-5' : '',
              ].join(' ')}
            />
          </span>
        </button>
        <p id={mirrorNoteId} className={SMALL_CLASSES}>
          Activé, le miroir repère les pièces portées&nbsp;: plus aucune confirmation le lendemain.
        </p>
      </section>

      <section className={BLOCK_CLASSES} aria-labelledby={swapId}>
        <h3 id={swapId} className={BLOCK_TITLE_CLASSES}>
          Bourse d’échange
        </h3>
        <Button fullWidth onClick={() => void simulateReservation()}>
          Un membre réserve mon annonce
        </Button>
        <p className={SMALL_CLASSES}>
          {myOpenListings > 0
            ? 'Joue l’autre côté de l’échange : un membre fictif réserve ta pièce et te propose un rendez-vous.'
            : 'Propose d’abord une pièce à l’échange (bouton Échanger dans À sortir ou le Dressing).'}
        </p>
      </section>

      <section className={BLOCK_CLASSES} aria-labelledby={nextId}>
        <h3 id={nextId} className={BLOCK_TITLE_CLASSES}>
          À faire maintenant
        </h3>
        <p role="status" className="m-0 rounded-[14px] bg-accent-tint px-3.5 py-3 font-medium text-pretty text-accent-ink">
          {hint}
        </p>
      </section>

      <p className={`${SMALL_CLASSES} border-t border-line pt-4`}>
        Les pièces, les dates et les chiffres sont des exemples. Les silhouettes remplacent de vraies photos.
      </p>
    </>
  )
}
