// Échange en cours (docs/03, parcours C et D) : étapes, rendez-vous dans un lieu public, messages,
// QR code de remise, puis avis. La remise est simulée : un bouton remplace le scan de l'autre téléphone.
import { AnimatePresence, motion } from 'motion/react'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { formatWeekday } from '../../app/format'
import { useWardrobe } from '../../app/WardrobeProvider'
import { Button, ButtonLink } from '../../components/Button'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { Icon } from '../../components/Icon'
import { SubScreenHeader } from '../../components/SubScreenHeader'
import { useToast } from '../../components/Toast'
import { MEETING_PLACES, MEETING_SLOTS, ME, isSwapOpen, swapRole } from '../../domain/swaps'
import type { Member, Swap } from '../../domain/swaps'
import { de } from '../../domain/wording'
import { ItemTile, SimulationNote, SwapStatusChip, creditsLabel, memberAvatar } from './parts'

const STEPS = ['Réservée', 'Rendez-vous', 'Remise', 'Avis'] as const

function stepIndex(swap: Swap): number {
  if (swap.status === 'completed') return swap.myRating === null ? 3 : 4
  if (swap.status === 'scheduled') return 2
  return 1
}

/** « 3F2A-9C01-B7DE » : plus lisible à dicter si le scan ne marche pas. */
function formatCode(code: string): string {
  return code.match(/.{1,4}/g)?.join('-') ?? code
}

export function SwapScreen() {
  const { swapId } = useParams()
  const { data, run } = useWardrobe()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const community = data.swaps
  const swap = community.swaps.find((s) => s.id === swapId)
  const listing = swap ? community.listings.find((l) => l.id === swap.listingId) : undefined

  if (!swap || !listing) {
    return (
      <>
        <SubScreenHeader title="Échange" backTo="/echanges?vue=echanges" backLabel="Retour à mes échanges" />
        <EmptyState title="Échange introuvable" />
      </>
    )
  }

  const role = swapRole(swap, ME)
  const other = community.members.find((m) => m.id === (role === 'giver' ? swap.receiverId : swap.giverId))
  const open = isSwapOpen(swap)

  // Toutes les actions : verrou contre le double appui, message d'erreur en toast.
  async function act(action: () => Promise<unknown>, success?: string) {
    if (busy) return
    setBusy(true)
    try {
      await action()
      if (success) showToast(success)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Action impossible pour le moment.')
    } finally {
      setBusy(false)
    }
  }

  const complete = () =>
    act(async () => {
      const result = await run((r) => r.completeSwap(swap.id, swap.handoverCode))
      showToast(
        result.receivedGarment
          ? `${result.receivedGarment.name} est dans ton dressing, fiche remplie.`
          : `+${creditsLabel(swap.credits)} ! Merci d’avoir fait circuler ta pièce.`,
      )
    })

  return (
    <>
      <SubScreenHeader title={listing.item.name} backTo="/echanges?vue=echanges" backLabel="Retour à mes échanges" />

      <Card tight className="flex-row! items-center">
        <ItemTile item={listing.item} size="med" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[15px] font-bold">
            {role === 'giver' ? 'Tu donnes à' : 'Tu reçois de'} {other?.displayName ?? 'un membre'}
          </span>
          <span className="text-[13px] text-muted">
            {role === 'giver' ? `+${creditsLabel(swap.credits)} à la remise` : `${creditsLabel(swap.credits)}`}
            {other ? ` · ${other.neighborhood}` : ''}
          </span>
          <SwapStatusChip swap={swap} />
        </div>
      </Card>

      {swap.status !== 'cancelled' && <Stepper current={stepIndex(swap)} />}

      <AnimatePresence mode="popLayout" initial={false}>
        {swap.status === 'cancelled' && (
          <motion.div key="cancelled" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <EmptyState title="Échange annulé">
              {role === 'receiver' ? 'Tes crédits ont été débloqués. ' : ''}L’annonce est de nouveau en ligne.
            </EmptyState>
          </motion.div>
        )}

        {swap.status === 'reserved' && (
          <motion.div key="meeting" layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <MeetingForm
              busy={busy}
              expiresOn={swap.expiresAt.slice(0, 10)}
              onSubmit={(place, slot) =>
                act(() => run((r) => r.scheduleSwap(swap.id, place, slot)), 'Rendez-vous proposé.')
              }
            />
          </motion.div>
        )}

        {swap.status === 'scheduled' && (
          <motion.div key="handover" layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="flex flex-col gap-4">
            <Card tight className="flex-row! items-start">
              <span className="grid size-10 flex-none place-items-center rounded-full bg-accent-tint text-accent-ink">
                <Icon name="check" size={20} strokeWidth={2.2} />
              </span>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold">{swap.meetingSlot}</span>
                <span className="text-[13px] text-muted">{swap.meetingPlace}</span>
              </div>
            </Card>
            <Handover swap={swap} role={role} other={other} busy={busy} onComplete={() => void complete()} />
          </motion.div>
        )}

        {swap.status === 'completed' && (
          <motion.div key="done" layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
            <Completed
              swap={swap}
              role={role}
              busy={busy}
              onRate={(rating) => act(() => run((r) => r.rateSwap(swap.id, rating)), 'Merci pour ton avis !')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {other && swap.status !== 'cancelled' && (
        <Messages
          swap={swap}
          other={other}
          disabled={busy}
          onSend={(body) => act(() => run((r) => r.sendSwapMessage(swap.id, body)))}
        />
      )}

      <div className="mt-auto flex flex-col gap-2.5">
        {open && (
          <Button
            disabled={busy}
            onClick={() =>
              void act(async () => {
                await run((r) => r.cancelSwap(swap.id))
                navigate('/echanges?vue=echanges')
              }, role === 'receiver' ? 'Échange annulé, tes crédits sont débloqués.' : 'Échange annulé.')
            }
          >
            Annuler l’échange
          </Button>
        )}
        <SimulationNote />
      </div>
    </>
  )
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="m-0 grid list-none grid-cols-4 gap-1.5 p-0" aria-label="Étapes de l’échange">
      {STEPS.map((step, index) => {
        const done = index < current
        const active = index === current
        return (
          <li key={step} className="flex flex-col gap-1.5" aria-current={active ? 'step' : undefined}>
            <span className="relative h-1.5 overflow-hidden rounded-full bg-tile">
              <motion.span
                className="absolute inset-y-0 left-0 rounded-full bg-accent"
                initial={false}
                animate={{ width: done ? '100%' : active ? '45%' : '0%' }}
                transition={{ type: 'spring', stiffness: 120, damping: 20, delay: index * 0.08 }}
              />
            </span>
            <span className={['text-[11px]', done || active ? 'font-bold text-ink' : 'text-muted'].join(' ')}>
              {step}
              <span className="sr-only">{done ? ' : fait' : active ? ' : en cours' : ''}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function MeetingForm({
  busy,
  expiresOn,
  onSubmit,
}: {
  busy: boolean
  expiresOn: string
  onSubmit: (place: string, slot: string) => void
}) {
  const [place, setPlace] = useState<string>(MEETING_PLACES[0])
  const [slot, setSlot] = useState<string>(MEETING_SLOTS[1])
  return (
    <Card className="gap-3!">
      <h2 className="m-0 font-display text-xl font-semibold">Fixer le rendez-vous</h2>
      <p className="m-0 text-[13px] text-muted">
        Sans rendez-vous, la réservation sera annulée {formatWeekday(expiresOn)} (72 h).
      </p>
      <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
        <legend className="mb-1.5 text-[13px] font-bold">Lieu public</legend>
        {MEETING_PLACES.map((p) => (
          <label
            key={p}
            className={[
              'flex min-h-12 cursor-pointer items-center gap-3 rounded-[14px] border px-3 text-sm transition-colors',
              place === p ? 'border-accent bg-accent-tint text-accent-ink' : 'border-line',
            ].join(' ')}
          >
            <input type="radio" name="place" checked={place === p} onChange={() => setPlace(p)} className="size-5 accent-accent" />
            {p}
          </label>
        ))}
      </fieldset>
      <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
        <legend className="mb-1.5 text-[13px] font-bold">Créneau</legend>
        <div className="flex flex-wrap gap-2">
          {MEETING_SLOTS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={slot === s}
              onClick={() => setSlot(s)}
              className={[
                'min-h-11 rounded-full border px-3.5 text-sm transition-colors',
                slot === s ? 'border-accent bg-accent font-bold text-on-accent' : 'border-outline text-ink',
              ].join(' ')}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>
      <Button variant="primary" disabled={busy} onClick={() => onSubmit(place, slot)}>
        Proposer ce rendez-vous
      </Button>
    </Card>
  )
}

function Handover({
  swap,
  role,
  other,
  busy,
  onComplete,
}: {
  swap: Swap
  role: 'giver' | 'receiver'
  other: Member | undefined
  busy: boolean
  onComplete: () => void
}) {
  const name = other?.displayName ?? 'l’autre membre'
  return (
    <Card className="items-center gap-3! text-center">
      <h2 className="m-0 font-display text-xl font-semibold">Au moment de la remise</h2>
      {role === 'giver' ? (
        <>
          <p className="m-0 text-sm text-muted">Montre ce code à {name}. Son scan confirme la remise pour vous deux.</p>
          <motion.div
            initial={{ rotate: -6, scale: 0.85, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
            className="rounded-3xl bg-white p-4 shadow-[var(--shadow-md)]"
          >
            <QRCodeSVG value={swap.handoverCode} size={168} bgColor="#FFFFFF" fgColor="#1C1A33" title="QR code de remise" />
          </motion.div>
          <code className="text-base font-bold tracking-[0.12em]">{formatCode(swap.handoverCode)}</code>
          <Button variant="primary" disabled={busy} onClick={onComplete}>
            {name} a scanné mon code (simulation)
          </Button>
        </>
      ) : (
        <>
          <p className="m-0 text-sm text-muted">
            Vérifie la pièce, puis scanne le QR code affiché par {name}. Rien n’est transféré si tu refuses.
          </p>
          <motion.span
            aria-hidden="true"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            className="grid size-28 place-items-center rounded-3xl border-2 border-dashed border-accent text-accent"
          >
            <Icon name="scan" size={44} strokeWidth={1.6} />
          </motion.span>
          <Button variant="primary" disabled={busy} onClick={onComplete}>
            Scanner le code {other ? de(other.displayName) : 'du membre'} (simulation)
          </Button>
        </>
      )}
    </Card>
  )
}

function Completed({
  swap,
  role,
  busy,
  onRate,
}: {
  swap: Swap
  role: 'giver' | 'receiver'
  busy: boolean
  onRate: (rating: number) => void
}) {
  return (
    <Card className="items-center gap-3! text-center">
      <motion.span
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }}
        className="grid size-16 place-items-center rounded-full bg-fresh text-on-fresh shadow-[var(--shadow-md)]"
      >
        <svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.4 }} />
        </svg>
      </motion.span>
      <h2 className="m-0 font-display text-2xl font-bold">Remise faite</h2>
      <p className="m-0 text-sm text-muted">
        {role === 'receiver'
          ? 'La pièce est dans ton dressing, avec sa fiche déjà remplie. Elle peut être proposée dès demain.'
          : `Tu as gagné ${creditsLabel(swap.credits)}. Ta pièce vit maintenant chez quelqu’un d’autre.`}
      </p>
      {role === 'receiver' && (
        <ButtonLink to="/dressing" variant="secondary" fullWidth={false}>
          Voir mon dressing
        </ButtonLink>
      )}
      {swap.myRating === null ? (
        <div className="flex flex-col items-center gap-2">
          <span className="text-[13px] font-bold">Note cet échange</span>
          <div role="group" aria-label="Note de 1 à 5" className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <motion.button
                key={n}
                type="button"
                disabled={busy}
                whileTap={{ scale: 0.8 }}
                whileHover={{ scale: 1.12 }}
                onClick={() => onRate(n)}
                aria-label={`${n} sur 5`}
                className="grid size-11 place-items-center text-[28px] leading-none text-amber"
              >
                ★
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        <p className="m-0 text-sm" aria-label={`Ta note : ${swap.myRating} sur 5`}>
          <span aria-hidden="true" className="text-amber">
            {'★'.repeat(swap.myRating)}
            <span className="text-line">{'★'.repeat(5 - swap.myRating)}</span>
          </span>
        </p>
      )}
    </Card>
  )
}

function Messages({
  swap,
  other,
  disabled,
  onSend,
}: {
  swap: Swap
  other: Member
  disabled: boolean
  onSend: (body: string) => Promise<void>
}) {
  const [draft, setDraft] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    const body = draft.trim()
    if (!body) return
    setDraft('')
    await onSend(body)
  }

  return (
    <section aria-labelledby="swap-messages" className="flex flex-col gap-2.5">
      <h2 id="swap-messages" className="m-0 flex items-center gap-2 text-[13px] font-bold tracking-[0.04em] text-muted uppercase">
        {memberAvatar(other)}
        Messages avec {other.displayName}
      </h2>
      <ol className="m-0 flex list-none flex-col gap-2 p-0" aria-live="polite">
        <AnimatePresence initial={false}>
          {swap.messages.map((m, index) => {
            const mine = m.senderId === ME
            return (
              <motion.li
                key={`${m.createdAt}-${index}`}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                // La réponse du membre arrive juste après la tienne, comme s'il tapait.
                transition={{ type: 'spring', stiffness: 400, damping: 30, delay: mine ? 0 : 0.6 }}
                className={[
                  'max-w-[85%] rounded-[18px] px-3.5 py-2 text-[15px]',
                  mine ? 'self-end rounded-br-md bg-accent text-on-accent' : 'self-start rounded-bl-md border border-line bg-surface',
                ].join(' ')}
              >
                <span className="sr-only">{mine ? 'Toi : ' : `${other.displayName} : `}</span>
                {m.body}
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ol>
      {swap.status !== 'completed' && (
        <form onSubmit={(e) => void submit(e)} className="flex items-center gap-2">
          <label htmlFor="swap-message" className="sr-only">
            Écrire à {other.displayName}
          </label>
          <input
            id="swap-message"
            type="text"
            maxLength={1000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Écrire à ${other.displayName}…`}
            className="min-h-12 min-w-0 flex-1 rounded-full border border-outline bg-surface px-4 text-base text-ink placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={disabled || draft.trim() === ''}
            aria-label="Envoyer"
            className="grid size-12 flex-none place-items-center rounded-full bg-accent text-on-accent transition-transform active:scale-90 disabled:opacity-45"
          >
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </form>
      )}
    </section>
  )
}
