// Carte de la tenue proposée : la pièce orpheline en grand, puis les valeurs sûres (todayScreen() du prototype).
import { AnimatePresence, motion } from 'motion/react'
import { Card } from '../../components/Card'
import { Chip } from '../../components/Chip'
import { GarmentTile } from '../../components/GarmentTile'
import { daysSinceLastWear } from '../../domain/dormancy'
import type { Outfit } from '../../domain/outfit'
import type { Garment, IsoDate } from '../../domain/types'
import { notWornSince, participle, wornAgo } from '../../domain/wording'

/** Une pièce jamais portée (achat accepté) n'a pas de date de port : on ne parle pas de durée. */
function neverWorn(garment: Garment): string | null {
  return garment.lastWornAt === null ? `Jamais ${participle(garment.agreement)}` : null
}

// La carte se retourne quand l'orpheline change (« Autre proposition »), les valeurs sûres arrivent en cascade.
const flip = {
  initial: { opacity: 0, rotateY: 60, scale: 0.96 },
  animate: { opacity: 1, rotateY: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 260, damping: 26 } },
  exit: { opacity: 0, rotateY: -60, scale: 0.96, transition: { duration: 0.16 } },
}

export function OutfitCard({ outfit, today, validated = false }: { outfit: Outfit; today: IsoDate; validated?: boolean }) {
  return (
    <div className="[perspective:1000px]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={outfit.orphan.id} variants={flip} initial="initial" animate="animate" exit="exit">
          <OutfitContent outfit={outfit} today={today} validated={validated} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function OutfitContent({ outfit, today, validated }: { outfit: Outfit; today: IsoDate; validated: boolean }) {
  const { orphan, companions } = outfit
  return (
    <Card
      aria-label="Tenue proposée"
      className={['transition-[border-color,box-shadow] duration-300', validated ? 'border-accent! shadow-[var(--shadow-accent)]!' : ''].join(' ')}
    >
      <div className="flex items-stretch gap-4">
        {/* La pièce oubliée « respire » doucement pour attirer l'œil (coupé si animations réduites). */}
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex"
        >
          <GarmentTile garment={orphan} size="big" />
        </motion.span>
        <div className="flex min-w-0 flex-col justify-center gap-2">
          <Chip tone="amber">Pièce oubliée</Chip>
          <h2 className="m-0 font-display text-[21px] leading-[1.15] font-semibold tracking-[-0.01em] break-words">
            {orphan.name}
          </h2>
          <p className="m-0 text-[13px] font-medium text-amber-ink">
            {neverWorn(orphan) ?? notWornSince(orphan.agreement, daysSinceLastWear(orphan, today))}
          </p>
        </div>
      </div>
      {companions.length > 0 && (
        <>
          <hr className="m-0 h-px border-0 bg-line" />
          {/* role="list" : Safari retire la sémantique d'une liste sans puces. */}
          <ul role="list" className="m-0 grid list-none grid-cols-2 gap-3 p-0" aria-label="Valeurs sûres">
            {companions.map((c, index) => (
              <motion.li
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + index * 0.07, type: 'spring', stiffness: 380, damping: 30 }}
                className="flex min-w-0 items-center gap-2.5"
              >
                <GarmentTile garment={c} size="sm" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm leading-[1.2] font-medium break-words">{c.name}</span>
                  <span className="text-xs text-muted">Valeur sûre</span>
                  <span className="text-xs text-muted">{neverWorn(c) ?? wornAgo(c.agreement, daysSinceLastWear(c, today))}</span>
                </div>
              </motion.li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}
