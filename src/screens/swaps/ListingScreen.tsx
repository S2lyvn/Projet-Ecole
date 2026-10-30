// Fiche d'une annonce de la bourse : la pièce, le membre, et « Réclamer cette pièce » (1 jeton bloqué).
import { motion } from 'motion/react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useWardrobe } from '../../app/WardrobeProvider'
import { Button, ButtonLink } from '../../components/Button'
import { Card } from '../../components/Card'
import { Chip } from '../../components/Chip'
import { EmptyState } from '../../components/EmptyState'
import { SubScreenHeader } from '../../components/SubScreenHeader'
import { useToast } from '../../components/Toast'
import { RESERVE_REFUSAL_MESSAGES, TOKENS_PER_GARMENT, balanceOf, canReserve } from '../../domain/tokens'
import { ME, isSwapOpen, openReservationsOf } from '../../domain/swaps'
import { CATEGORY_LABELS, CONDITION_LABELS } from '../../domain/wording'
import { ItemTile, MemberLine, SimulationNote, TokenCoin, memberAvatar } from './parts'

export function ListingScreen() {
  const { listingId } = useParams()
  const { data, run } = useWardrobe()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const community = data.swaps
  const listing = community.listings.find((l) => l.id === listingId)

  if (!listing) {
    return (
      <>
        <SubScreenHeader title="Annonce" backTo="/echanges" backLabel="Retour à la bourse" />
        <EmptyState title="Annonce introuvable">Elle a peut-être été retirée.</EmptyState>
      </>
    )
  }

  const mine = listing.ownerId === ME
  const owner = community.members.find((m) => m.id === listing.ownerId)
  const swap = community.swaps.find((s) => s.listingId === listing.id && (isSwapOpen(s) || s.status === 'completed'))
  const check = canReserve({
    isAdult: community.isAdult,
    isOwner: mine,
    openReservations: openReservationsOf(community.swaps, ME),
    balance: balanceOf(community.ledger),
    cost: TOKENS_PER_GARMENT,
  })

  async function reserve() {
    if (busy || !listing) return
    setBusy(true)
    try {
      const created = await run((r) => r.reserveListing(listing.id))
      navigate(`/echanges/echange/${created.id}`)
      showToast(`Réclamée ! Ton jeton est bloqué jusqu’à la remise.`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Réservation impossible pour le moment.')
      setBusy(false)
    }
  }

  async function withdraw() {
    if (busy || !listing) return
    setBusy(true)
    try {
      await run((r) => r.withdrawListing(listing.id))
      navigate('/echanges?vue=annonces')
      showToast('Annonce retirée. La pièce reste dans ton dressing.')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Action impossible pour le moment.')
      setBusy(false)
    }
  }

  return (
    <>
      <SubScreenHeader
        title={listing.item.name}
        backTo={mine ? '/echanges?vue=annonces' : '/echanges'}
        backLabel={mine ? 'Retour à mes annonces' : 'Retour à la bourse'}
      />

      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="relative flex justify-center"
      >
        <ItemTile item={listing.item} size="hero" />
      </motion.div>

      <div className="flex flex-wrap gap-2">
        <Chip tone="accent">{CATEGORY_LABELS[listing.item.category]}</Chip>
        {listing.item.size && <Chip tone="accent">Taille {listing.item.size}</Chip>}
        <Chip tone="fresh">{CONDITION_LABELS[listing.condition]}</Chip>
        {listing.circle && <Chip tone="wash">{listing.circle}</Chip>}
      </div>

      {listing.note && <p className="m-0 text-[15px] text-pretty">« {listing.note} »</p>}

      {owner && (
        <Card tight className="flex-row! items-center">
          {memberAvatar(owner)}
          <div className="flex min-w-0 flex-col">
            <span className="text-[15px] font-bold">{owner.displayName}</span>
            <MemberLine member={owner} />
            <span className="text-xs text-muted">
              {owner.swapsCount} échanges réussis · membre depuis {owner.memberSince}
            </span>
          </div>
        </Card>
      )}

      <p className="m-0 text-[13px] text-muted">
        Remise en main propre dans un lieu public de {listing.city}. Jamais d’adresse personnelle.
      </p>

      <div className="mt-auto flex flex-col gap-2.5">
        {mine ? (
          listing.status === 'open' ? (
            <Button disabled={busy} onClick={() => void withdraw()}>
              Retirer l’annonce
            </Button>
          ) : swap ? (
            <ButtonLink to={`/echanges/echange/${swap.id}`} variant="primary" size="lg">
              Voir l’échange
            </ButtonLink>
          ) : null
        ) : swap ? (
          <ButtonLink to={`/echanges/echange/${swap.id}`} variant="primary" size="lg">
            Voir mon échange
          </ButtonLink>
        ) : listing.status !== 'open' ? (
          <EmptyState title="Déjà réservée">Quelqu’un a été plus rapide. D’autres pièces t’attendent.</EmptyState>
        ) : (
          <>
            <Button
              variant="primary"
              size="lg"
              disabled={busy}
              aria-disabled={!check.ok}
              aria-describedby={check.ok ? undefined : 'reserve-refusal'}
              onClick={() => (check.ok ? void reserve() : undefined)}
            >
              <TokenCoin size={24} />
              Réclamer cette pièce · 1 jeton
            </Button>
            {!check.ok && (
              <p id="reserve-refusal" className="m-0 text-center text-sm text-amber-ink">
                {RESERVE_REFUSAL_MESSAGES[check.reason]}
              </p>
            )}
            {check.ok && (
              <p className="m-0 text-center text-[13px] text-muted">
                Ton jeton est bloqué, puis utilisé quand tu confirmes la remise. Annuler te le rend.
              </p>
            )}
          </>
        )}
        <SimulationNote />
      </div>
    </>
  )
}
