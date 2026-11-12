// Onglet Échanges : mes jetons, mes échanges en cours et mes annonces. La Bourse est sur la Carte (accueil).
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useWardrobe } from '../../app/WardrobeProvider'
import { ButtonLink } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { Icon } from '../../components/Icon'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Segmented } from '../../components/Segmented'
import { ME, isSwapOpen, swapRole } from '../../domain/swaps'
import type { SwapListing } from '../../domain/swaps'
import { balanceOf, heldTokens } from '../../domain/tokens'
import { plural } from '../../domain/wording'
import { ItemTile, SwapStatusChip, TokenCoin, tokensLabel } from './parts'

const LISTING_STATUS_LABELS: Record<SwapListing['status'], string> = {
  open: 'En ligne',
  reserved: 'Réservée',
  completed: 'Échangée',
  cancelled: 'Retirée',
  expired: 'Expirée',
}

// Apparition en cascade des lignes (coupée si l'utilisateur réduit les animations : MotionConfig).
const list = { show: { transition: { staggerChildren: 0.04 } } }
const listItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 420, damping: 32 } },
}

const ROW_LINK =
  'flex items-center gap-3 rounded-[20px] border border-line bg-surface p-3 text-ink no-underline shadow-[var(--shadow-sm)] transition-transform active:scale-[0.99]'

export function SwapsScreen() {
  const { data } = useWardrobe()
  const { swaps: community } = data
  const [params, setParams] = useSearchParams()
  // Anciennes adresses (?vue=bourse) : la Bourse est maintenant sur la Carte, on retombe sur « En cours ».
  const view = params.get('vue') === 'annonces' ? 'annonces' : 'echanges'
  const [info, setInfo] = useState(false)

  const balance = balanceOf(community.ledger)
  const held = heldTokens(community.ledger)
  const openSwaps = community.swaps.filter(isSwapOpen).length
  const myOpenListings = community.listings.filter(
    (l) => l.ownerId === ME && (l.status === 'open' || l.status === 'reserved'),
  ).length

  return (
    <>
      <ScreenHeader title="Échanges" />

      <section aria-label="Mes jetons" className="flex flex-col gap-2 rounded-3xl bg-accent-tint p-4 text-accent-ink">
        <div className="flex items-center gap-3">
          {/* Un jeton par pièce donnée : les nouveaux tombent dans la rangée avec un rebond. */}
          <div className="flex items-center -space-x-2" aria-hidden="true">
            <AnimatePresence initial={false}>
              {Array.from({ length: Math.min(balance, 4) }, (_, i) => (
                <motion.span
                  key={`coin-${i}`}
                  initial={{ y: -30, rotate: -90, opacity: 0 }}
                  animate={{ y: 0, rotate: 0, opacity: 1, transition: { type: 'spring', stiffness: 380, damping: 14 } }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <TokenCoin size={34} />
                </motion.span>
              ))}
              {Array.from({ length: Math.min(held, 2) }, (_, i) => (
                <motion.span key={`held-${i}`} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <TokenCoin size={34} muted />
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <motion.span
              key={balance}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="font-display text-2xl leading-tight font-bold"
            >
              {tokensLabel(balance)}
            </motion.span>
            {held > 0 && (
              <span className="text-xs">
                dont {held} {plural(held, 'bloqué', 'bloqués')} en ce moment
              </span>
            )}
          </div>
          <button
            type="button"
            aria-expanded={info}
            aria-controls="token-rule"
            aria-label="Comment marchent les jetons ?"
            onClick={() => setInfo((v) => !v)}
            className="grid size-11 flex-none place-items-center rounded-full text-lg font-bold"
          >
            <span aria-hidden="true" className="grid size-7 place-items-center rounded-full border-2 border-current text-sm">
              i
            </span>
          </button>
        </div>
        <AnimatePresence initial={false}>
          {info && (
            <motion.p
              id="token-rule"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="m-0 overflow-hidden text-sm leading-snug"
            >
              1 habit donné = 1 jeton = 1 habit à réclamer, chez n’importe quel membre, quand tu veux. Pas d’expiration,
              pas d’achat, pas d’euros.
            </motion.p>
          )}
        </AnimatePresence>
      </section>

      <ButtonLink to="/armoire?filtre=dort" variant="primary" size="lg">
        Donner une pièce
      </ButtonLink>

      <Segmented
        label="Mes échanges"
        value={view}
        onChange={(v) => setParams(v === 'echanges' ? {} : { vue: v }, { replace: true })}
        options={[
          { value: 'echanges', label: 'En cours', badge: openSwaps },
          { value: 'annonces', label: 'Mes annonces', badge: myOpenListings },
        ]}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          role="tabpanel"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col gap-4"
        >
          {view === 'echanges' ? <MySwaps /> : <MyListings />}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

function MySwaps() {
  const { data } = useWardrobe()
  const { swaps: community } = data
  const members = new Map(community.members.map((m) => [m.id, m]))
  const listings = new Map(community.listings.map((l) => [l.id, l]))
  // En cours d'abord, puis les plus récents.
  const sorted = [...community.swaps].sort(
    (a, b) => Number(isSwapOpen(b)) - Number(isSwapOpen(a)) || b.reservedAt.localeCompare(a.reservedAt),
  )

  if (sorted.length === 0) {
    return (
      <EmptyState title="Aucun échange">
        <Link to="/" className="font-bold text-accent-ink underline">
          Trouve une pièce près de chez toi
        </Link>
      </EmptyState>
    )
  }
  return (
    <motion.ul
      variants={list}
      initial="hidden"
      animate="show"
      className="m-0 flex list-none flex-col gap-2.5 p-0"
      aria-label="Mes échanges"
    >
      {sorted.map((swap) => {
        const listing = listings.get(swap.listingId)
        if (!listing) return null
        const role = swapRole(swap, ME)
        const other = members.get(role === 'giver' ? swap.receiverId : swap.giverId)
        return (
          <motion.li key={swap.id} variants={listItem}>
            <Link to={`/echanges/echange/${swap.id}`} className={ROW_LINK}>
              <ItemTile item={listing.item} size="sm" />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-[15px] font-bold">{listing.item.name}</span>
                <span className="truncate text-[13px] text-muted">
                  {role === 'giver' ? 'Tu donnes à' : 'Tu reçois de'} {other?.displayName ?? 'un membre'}
                </span>
                <SwapStatusChip swap={swap} />
              </span>
              <Icon name="chev" size={20} />
            </Link>
          </motion.li>
        )
      })}
    </motion.ul>
  )
}

function MyListings() {
  const { data } = useWardrobe()
  const mine = data.swaps.listings
    .filter((l) => l.ownerId === ME && l.garmentId !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  if (mine.length === 0) {
    return <EmptyState title="Aucune annonce">Une pièce qui dort peut vivre chez quelqu’un d’autre.</EmptyState>
  }
  return (
    <motion.ul
      variants={list}
      initial="hidden"
      animate="show"
      className="m-0 flex list-none flex-col gap-2.5 p-0"
      aria-label="Mes annonces"
    >
      {mine.map((l) => (
        <motion.li key={l.id} variants={listItem}>
          <Link to={`/echanges/annonce/${l.id}`} className={ROW_LINK}>
            <ItemTile item={l.item} size="sm" />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-[15px] font-bold">{l.item.name}</span>
              <span className="text-[13px] text-muted">
                {LISTING_STATUS_LABELS[l.status]}
                {l.status === 'completed'
                  ? ' · 1 jeton gagné'
                  : l.status === 'open' || l.status === 'reserved'
                    ? ' · +1 jeton à la remise'
                    : ''}
              </span>
            </span>
            <Icon name="chev" size={20} />
          </Link>
        </motion.li>
      ))}
    </motion.ul>
  )
}
