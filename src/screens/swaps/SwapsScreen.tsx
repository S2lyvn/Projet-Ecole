// Onglet Échanges (docs/03-communaute-echange.md) : jetons de réclamation, Bourse, Mes échanges, Mes annonces.
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useWardrobe } from '../../app/WardrobeProvider'
import { ButtonLink } from '../../components/Button'
import { Card } from '../../components/Card'
import { Chip } from '../../components/Chip'
import { EmptyState } from '../../components/EmptyState'
import { Icon } from '../../components/Icon'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Segmented } from '../../components/Segmented'
import { Switch } from '../../components/Switch'
import { balanceOf, heldTokens } from '../../domain/tokens'
import { ME, filterListings, isSwapOpen, swapRole } from '../../domain/swaps'
import type { ListingCategoryFilter, Member, SwapListing } from '../../domain/swaps'
import { CONDITION_LABELS, plural } from '../../domain/wording'
import { ItemTile, SimulationNote, SwapStatusChip, TokenCoin, tokensLabel } from './parts'

const CATEGORY_FILTERS: { value: ListingCategoryFilter; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'tops', label: 'Hauts' },
  { value: 'bottoms', label: 'Bas' },
  { value: 'dress', label: 'Robes' },
  { value: 'shoes', label: 'Chaussures' },
  { value: 'outerwear', label: 'Manteaux' },
]

const LISTING_STATUS_LABELS: Record<SwapListing['status'], string> = {
  open: 'En ligne',
  reserved: 'Réservée',
  completed: 'Échangée',
  cancelled: 'Retirée',
  expired: 'Expirée',
}

// Apparition en cascade des cartes (désactivée si l'utilisateur réduit les animations : MotionConfig).
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
  const view = (['bourse', 'echanges', 'annonces'] as const).find((v) => v === params.get('vue')) ?? 'bourse'

  const balance = balanceOf(community.ledger)
  const held = heldTokens(community.ledger)
  const openSwaps = community.swaps.filter(isSwapOpen).length
  const myOpenListings = community.listings.filter(
    (l) => l.ownerId === ME && (l.status === 'open' || l.status === 'reserved'),
  ).length

  return (
    <>
      <ScreenHeader title="Échanges" subtitle="Troque tes pièces qui dorment contre celles des autres membres." />

      <Card tone="tint" className="gap-3!">
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-bold tracking-[0.04em] text-accent-ink uppercase">Mes jetons</span>
            <motion.span
              key={balance}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="font-display text-[40px] leading-none font-bold tracking-[-0.02em] text-accent-ink tabular-nums"
            >
              {balance}
            </motion.span>
          </div>
          {/* Un jeton par pièce : les nouveaux tombent dans la rangée avec un rebond. */}
          <div className="flex flex-wrap justify-end gap-1.5" aria-hidden="true">
            <AnimatePresence initial={false}>
              {Array.from({ length: Math.min(balance, 6) }, (_, i) => (
                <motion.span
                  key={`coin-${i}`}
                  initial={{ y: -36, rotate: -90, opacity: 0 }}
                  animate={{ y: 0, rotate: 0, opacity: 1, transition: { type: 'spring', stiffness: 380, damping: 14 } }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <TokenCoin />
                </motion.span>
              ))}
              {Array.from({ length: Math.min(held, 3) }, (_, i) => (
                <motion.span key={`held-${i}`} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <TokenCoin muted />
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
        {held > 0 && (
          <span className="text-[13px] text-accent-ink">
            {tokensLabel(held)} {plural(held, 'bloqué', 'bloqués')} par {plural(held, 'ta réclamation', 'tes réclamations')} en cours
          </span>
        )}
        <p className="m-0 text-[13px] leading-snug text-accent-ink">
          <strong>1 habit donné = 1 jeton = 1 habit à réclamer</strong> chez n’importe quel membre, quand tu veux. Les
          jetons n’expirent pas, ne s’achètent pas et ne valent pas d’euros.
        </p>
      </Card>

      <Segmented
        label="Bourse d’échange"
        value={view}
        onChange={(v) => setParams(v === 'bourse' ? {} : { vue: v }, { replace: true })}
        options={[
          { value: 'bourse', label: 'Bourse' },
          { value: 'echanges', label: 'Échanges', badge: openSwaps },
          { value: 'annonces', label: 'Annonces', badge: myOpenListings },
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
          {view === 'bourse' && <Market />}
          {view === 'echanges' && <MySwaps />}
          {view === 'annonces' && <MyListings />}
        </motion.div>
      </AnimatePresence>

      <SimulationNote />
    </>
  )
}

function Market() {
  const { data } = useWardrobe()
  const { swaps: community } = data
  const [category, setCategory] = useState<ListingCategoryFilter>('all')
  const [mySizesOnly, setMySizesOnly] = useState(true)
  const members = useMemo(() => new Map(community.members.map((m) => [m.id, m])), [community.members])
  const listings = filterListings(community.listings, { category, mySizesOnly, sizes: community.sizes, memberId: ME })

  return (
    <>
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]" role="group" aria-label="Catégorie">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={category === f.value}
            onClick={() => setCategory(f.value)}
            className={[
              'min-h-11 flex-none rounded-full border px-4 text-sm transition-colors',
              category === f.value
                ? 'border-accent bg-accent font-bold text-on-accent'
                : 'border-outline font-medium text-ink',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>
      <Switch
        checked={mySizesOnly}
        onChange={setMySizesOnly}
        label="À ma taille"
        // Trait d'union insécable : « Clermont-Ferrand » ne se coupe pas en fin de ligne.
        description={`Haut ${community.sizes.top} · bas ${community.sizes.bottom} · pointure ${community.sizes.shoes} · ${community.city.replace('-', '\u2011')}`}
      />

      {listings.length === 0 ? (
        <EmptyState title="Rien pour l’instant">Change de catégorie ou retire le filtre de taille.</EmptyState>
      ) : (
        <motion.ul
          key={`${category}-${mySizesOnly}`}
          variants={list}
          initial="hidden"
          animate="show"
          className="m-0 grid list-none grid-cols-2 gap-3 p-0"
          aria-label="Annonces de la bourse"
        >
          {listings.map((l) => (
            <motion.li key={l.id} variants={listItem}>
              <ListingCard listing={l} member={members.get(l.ownerId)} />
            </motion.li>
          ))}
        </motion.ul>
      )}
    </>
  )
}

function ListingCard({ listing, member }: { listing: SwapListing; member: Member | undefined }) {
  return (
    <Link
      to={`/echanges/annonce/${listing.id}`}
      className="flex h-full flex-col gap-2 rounded-[20px] border border-line bg-surface p-2.5 text-ink no-underline shadow-[var(--shadow-sm)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] active:scale-[0.98]"
    >
      <ItemTile item={listing.item} size="grid" />
      <span className="line-clamp-2 text-sm leading-tight font-bold">{listing.item.name}</span>
      <span className="text-xs text-muted">
        {listing.item.size ? `Taille ${listing.item.size} · ` : ''}
        {CONDITION_LABELS[listing.condition]}
      </span>
      {member && (
        <span className="mt-auto truncate text-xs text-muted">
          {member.displayName} · {member.neighborhood}
        </span>
      )}
      {listing.circle && <Chip tone="accent">{listing.circle}</Chip>}
    </Link>
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
    return <EmptyState title="Aucun échange">Réserve une pièce dans la bourse, ou propose les tiennes.</EmptyState>
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

  return (
    <>
      {mine.length === 0 ? (
        <EmptyState title="Aucune annonce">
          Une pièce qui dort chez toi peut vivre chez quelqu’un d’autre. Tu gagnes 1 jeton à la remise.
        </EmptyState>
      ) : (
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
                    {l.status === 'completed' ? ' · 1 jeton gagné' : l.status === 'open' || l.status === 'reserved' ? ' · +1 jeton à la remise' : ''}
                  </span>
                </span>
                <Icon name="chev" size={20} />
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      )}
      <ButtonLink to="/a-sortir" variant="primary">
        Proposer une pièce qui dort
      </ButtonLink>
    </>
  )
}
