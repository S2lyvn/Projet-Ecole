// Écran Aujourd'hui : la tenue du jour, construite autour d'une pièce oubliée (todayScreen() du prototype).
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatLongDate } from '../../app/format'
import { useActiveGarments, useWardrobe } from '../../app/WardrobeProvider'
import { Banner } from '../../components/Banner'
import { Button, ButtonLink, buttonClasses } from '../../components/Button'
import { Card } from '../../components/Card'
import { ScreenHeader } from '../../components/ScreenHeader'
import { useToast } from '../../components/Toast'
import type { DailyOutfitState } from '../../data/repository'
import { isInLaundry } from '../../domain/laundry'
import { buildOutfit, nextOrphanId } from '../../domain/outfit'
import { plural } from '../../domain/wording'
import { OutfitCard } from './OutfitCard'

/** Bascule entre « proposée » et « validée » : fondu et léger glissement. */
const swapIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.18 },
}

/** Bouton qui reçoit le focus après une bascule (data-fk, comme S._focus du prototype). */
type FocusKey = 'validate' | 'unvalidate' | 'other' | 'undismiss'

const NOTE_CLASSES = 'm-0 text-center text-[13px] leading-[1.4] text-pretty text-muted'
const H2_CLASSES = 'm-0 font-display text-[21px] leading-[1.15] font-semibold tracking-[-0.01em]'

export function TodayScreen() {
  const { data, run } = useWardrobe()
  const garments = useActiveGarments()
  const { showToast } = useToast()
  const { today, dailyOutfit, pending, settings } = data

  const outfit = useMemo(
    () => buildOutfit(garments, today, dailyOutfit.orphanId),
    [garments, today, dailyOutfit.orphanId],
  )

  // Seules les pièces encore dans le dressing comptent (une pièce donnée entre-temps ne se confirme plus).
  const pendingCount = useMemo(() => {
    if (!pending) return 0
    const activeIds = new Set(garments.map((g) => g.id))
    return pending.garmentIds.filter((id) => activeIds.has(id)).length
  }, [pending, garments])

  const focusNext = useRef<FocusKey | null>(null)
  // Annonce pour les lecteurs d'écran quand la tenue change sans que le focus bouge.
  const [announce, setAnnounce] = useState('')
  const busy = useRef(false)

  // Après le rechargement des données, le focus va sur le bouton logique du nouvel état. Si ce bouton arrive
  // avec une animation (bloc « validée » ↔ « proposée »), on réessaie quand son bloc est monté (blockRef).
  const tryFocus = useCallback(() => {
    const key = focusNext.current
    if (!key) return
    const target = document.querySelector<HTMLElement>(`[data-fk="${key}"]`)
    if (!target) return
    focusNext.current = null
    target.focus()
  }, [])
  useEffect(tryFocus, [dailyOutfit, tryFocus])
  const blockRef = useCallback((el: HTMLDivElement | null) => {
    if (el) tryFocus()
  }, [tryFocus])

  async function save(patch: Partial<DailyOutfitState>, focus: FocusKey, message?: string, spoken = '') {
    if (busy.current) return
    busy.current = true
    focusNext.current = focus
    setAnnounce('')
    try {
      await run((r) => r.saveDailyOutfit({ ...dailyOutfit, ...patch }))
      if (message) showToast(message)
      setAnnounce(spoken)
    } catch {
      focusNext.current = null
      showToast('Impossible d’enregistrer pour le moment. Réessaie.')
    } finally {
      busy.current = false
    }
  }

  function otherOutfit() {
    const next = nextOrphanId(garments, today, dailyOutfit.orphanId)
    if (next === null) {
      showToast('Aucune autre proposition pour le moment.')
      return
    }
    const name = garments.find((g) => g.id === next)?.name
    void save({ orphanId: next, status: 'proposed' }, 'other', undefined, name ? `Nouvelle proposition\u00a0: ${name}.` : '')
  }

  const header = (
    <>
      <ScreenHeader
        eyebrow={formatLongDate(today)}
        title="Tenue du jour"
        subtitle="Construite autour d’une pièce que tu ne portes plus."
      />
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      {pendingCount > 0 && (
        <Banner to="/confirmer">
          Hier&nbsp;: {pendingCount} {plural(pendingCount, 'pièce', 'pièces')} à confirmer
        </Banner>
      )}
    </>
  )

  if (!outfit) {
    // Les chaussures ne sont jamais orphelines : s'il reste d'autres pièces, elles sont toutes au lavage.
    const allWashing = garments.some((g) => g.category !== 'shoes' && isInLaundry(g, today))
    return (
      <>
        {header}
        <Card className="items-start">
          <h2 className={H2_CLASSES}>Rien à proposer</h2>
          <p className="m-0 text-sm text-muted">
            {allWashing
              ? 'Toutes tes pièces sont au lavage. Remets-en une en jeu depuis le dressing.'
              : 'Ajoute au moins un vêtement, pas seulement des chaussures, depuis le dressing.'}
          </p>
          <ButtonLink to="/dressing" size="sm">
            Ouvrir le dressing
          </ButtonLink>
        </Card>
      </>
    )
  }

  if (dailyOutfit.status === 'dismissed') {
    return (
      <>
        {header}
        <Card className="items-start">
          <h2 className={H2_CLASSES}>Pas de tenue aujourd’hui</h2>
          <p className="m-0 text-sm text-muted">Ton dressing ne bouge pas. Tu peux revoir la proposition à tout moment.</p>
          <Button data-fk="undismiss" variant="primary" size="sm" onClick={() => void save({ status: 'proposed' }, 'validate')}>
            Revoir la proposition
          </Button>
        </Card>
      </>
    )
  }

  return (
    <>
      {header}
      <OutfitCard outfit={outfit} today={today} validated={dailyOutfit.status === 'validated'} />
      <AnimatePresence mode="wait" initial={false}>
      {dailyOutfit.status === 'validated' ? (
        <motion.div key="validated" ref={blockRef} {...swapIn} className="flex flex-col gap-2.5">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1, transition: { type: 'spring', stiffness: 420, damping: 14 } }}
            className={buttonClasses('done', 'lg')}
          >
            <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.12, duration: 0.35 }} />
            </svg>
            Tenue validée
          </motion.div>
          <Button data-fk="unvalidate" onClick={() => void save({ status: 'proposed' }, 'validate')}>
            Changer de tenue
          </Button>
          <p className={NOTE_CLASSES}>
            {settings.mirrorMode
              ? 'Le miroir détectera la tenue demain\u00a0: rien à confirmer.'
              : 'Demain matin, tu confirmeras ces pièces d’un geste.'}
          </p>
        </motion.div>
      ) : (
        <motion.div key="proposed" ref={blockRef} {...swapIn} className="flex flex-col gap-2.5">
          <Button
            data-fk="validate"
            variant="primary"
            size="lg"
            onClick={() => void save({ status: 'validated' }, 'unvalidate', 'Tenue validée.')}
          >
            Je porte cette tenue
          </Button>
          <div className="flex gap-2.5">
            <Button data-fk="other" className="min-w-0 flex-1 px-2!" onClick={otherOutfit}>
              Autre proposition
            </Button>
            <Button className="min-w-0 flex-1 px-2!" onClick={() => void save({ status: 'dismissed' }, 'undismiss')}>
              Pas aujourd’hui
            </Button>
          </div>
          <p className={NOTE_CLASSES}>Un geste suffit&nbsp;: en validant la tenue, ton dressing se met à jour.</p>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  )
}
