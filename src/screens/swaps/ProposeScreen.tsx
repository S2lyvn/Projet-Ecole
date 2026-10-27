// « Proposer à l'échange » (docs/03, parcours A) : fiche préremplie depuis le dressing, état, phrase, visibilité,
// deux engagements. Les règles de la communauté s'affichent une fois, avant la première annonce.
import { motion } from 'motion/react'
import { useId, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useWardrobe } from '../../app/WardrobeProvider'
import { BottomSheet } from '../../components/BottomSheet'
import { Button, ButtonLink } from '../../components/Button'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { GarmentTile } from '../../components/GarmentTile'
import { Icon } from '../../components/Icon'
import { Pills } from '../../components/Pills'
import { SubScreenHeader } from '../../components/SubScreenHeader'
import { useToast } from '../../components/Toast'
import { creditsFor } from '../../domain/credits'
import { activeListingFor } from '../../domain/swaps'
import { ITEM_CONDITIONS } from '../../domain/types'
import type { ItemCondition } from '../../domain/types'
import { CATEGORY_LABELS, CONDITION_LABELS } from '../../domain/wording'
import { DEMO_CIRCLE } from '../../data/sampleCommunity'
import { SimulationNote, creditsLabel } from './parts'

const RULES = [
  'La pièce est propre et en état d’être portée.',
  'Tu es honnête sur son état et tu signales les défauts.',
  'Les remises se font dans un lieu public, jamais chez toi.',
  'Respect et ponctualité : préviens si tu ne peux pas venir.',
]

export function ProposeScreen() {
  const { garmentId } = useParams()
  const { data, run } = useWardrobe()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const garment = data.garments.find((g) => g.id === garmentId && g.status === 'active')
  const existing = garment ? activeListingFor(data.swaps.listings, garment.id) : null

  const [condition, setCondition] = useState<ItemCondition>('very_good')
  const [note, setNote] = useState('')
  const [circle, setCircle] = useState<'city' | 'circle'>('city')
  const [clean, setClean] = useState(false)
  const [honest, setHonest] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(!data.swaps.rulesAccepted)
  const [busy, setBusy] = useState(false)
  const rulesTitleId = useId()

  if (!garment || existing) {
    return (
      <>
        <SubScreenHeader title="Proposer à l’échange" backTo="/a-sortir" backLabel="Retour" />
        {existing ? (
          <>
            <EmptyState title="Déjà proposée">Cette pièce est déjà en ligne dans la bourse.</EmptyState>
            <ButtonLink to={`/echanges/annonce/${existing.id}`} variant="primary">
              Voir l’annonce
            </ButtonLink>
          </>
        ) : (
          <EmptyState title="Pièce introuvable">Elle n’est plus dans ton dressing.</EmptyState>
        )}
      </>
    )
  }

  const credits = creditsFor(garment.category)

  async function publish() {
    if (!garment || busy || !clean || !honest) return
    setBusy(true)
    try {
      await run((r) =>
        r.publishListing({
          garmentId: garment.id,
          condition,
          note: note.trim() || null,
          circle: circle === 'circle' ? DEMO_CIRCLE : null,
        }),
      )
      navigate('/echanges?vue=annonces')
      showToast(`${garment.name} est dans la bourse. Tu gagneras ${creditsLabel(credits)} à la remise.`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Publication impossible pour le moment.')
      setBusy(false)
    }
  }

  async function acceptRules() {
    await run((r) => r.acceptCommunityRules())
    setRulesOpen(false)
  }

  return (
    <>
      <SubScreenHeader
        title="Proposer à l’échange"
        subtitle="La fiche est déjà remplie : elle arrivera telle quelle chez la personne qui la prend."
        backTo="/a-sortir"
        backLabel="Retour"
      />

      <Card tight className="flex-row! items-center">
        <GarmentTile garment={garment} size="lg" />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-base font-bold">{garment.name}</span>
          <span className="text-[13px] text-muted">
            {CATEGORY_LABELS[garment.category]}
            {garment.size ? ` · taille ${garment.size}` : ''}
          </span>
          <span className="self-start rounded-full bg-accent-tint px-2.5 py-1 text-xs font-bold text-accent-ink">
            +{creditsLabel(credits)} à la remise
          </span>
        </div>
      </Card>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 text-[13px] font-bold">État</legend>
        <div className="grid grid-cols-2 gap-2">
          {ITEM_CONDITIONS.map((c) => (
            <label
              key={c}
              className={[
                'relative flex min-h-12 cursor-pointer items-center justify-center rounded-[14px] border px-2 text-center text-sm transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent',
                condition === c ? 'border-accent bg-accent-tint font-bold text-accent-ink' : 'border-outline text-ink',
              ].join(' ')}
            >
              <input
                type="radio"
                name="condition"
                value={c}
                checked={condition === c}
                onChange={() => setCondition(c)}
                className="sr-only"
              />
              {CONDITION_LABELS[c]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="swap-note" className="text-[13px] font-bold">
          Un mot sur la pièce (facultatif)
        </label>
        <textarea
          id="swap-note"
          rows={2}
          maxLength={200}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ex. Portée deux fois, trop petite pour moi."
          className="min-h-20 w-full resize-none rounded-[14px] border border-outline bg-surface px-3.5 py-3 text-base text-ink placeholder:text-muted"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-bold">Visible par</span>
        <Pills
          label="Visibilité de l’annonce"
          value={circle}
          onChange={setCircle}
          options={[
            { value: 'city', label: data.swaps.city },
            { value: 'circle', label: 'Ma promo' },
          ]}
        />
      </div>

      <fieldset className="m-0 flex flex-col rounded-3xl border border-line bg-surface px-4 py-1">
        <legend className="sr-only">Engagements</legend>
        {[
          { checked: clean, set: setClean, label: 'La pièce est propre' },
          { checked: honest, set: setHonest, label: 'J’ai signalé les défauts' },
        ].map((item) => (
          <label key={item.label} className="flex min-h-14 cursor-pointer items-center gap-3 border-b border-line last:border-b-0">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(e) => item.set(e.target.checked)}
              className="m-0 size-6 flex-none accent-accent"
            />
            <span className="text-[15px] font-medium">{item.label}</span>
          </label>
        ))}
      </fieldset>

      <div className="mt-auto flex flex-col gap-2.5">
        <Button variant="primary" size="lg" disabled={!clean || !honest || busy} onClick={() => void publish()}>
          Mettre dans la bourse
        </Button>
        <SimulationNote />
      </div>

      <BottomSheet open={rulesOpen} onClose={() => navigate(-1)} labelledBy={rulesTitleId}>
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-bold tracking-[0.06em] text-muted uppercase">Avant ta première annonce</span>
          <h2 id={rulesTitleId} className="m-0 font-display text-2xl leading-tight font-bold">
            Les règles de la communauté
          </h2>
        </div>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {RULES.map((rule, index) => (
            <motion.li
              key={rule}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * index + 0.15 }}
              className="flex items-start gap-3 text-[15px]"
            >
              <span className="grid size-7 flex-none place-items-center rounded-full bg-accent-tint text-accent-ink">
                <Icon name="check" size={16} strokeWidth={2.4} />
              </span>
              {rule}
            </motion.li>
          ))}
        </ul>
        <p className="m-0 text-[13px] text-muted">
          Pas de fil, pas de likes : la bourse sert seulement à faire circuler les pièces qui dorment.
        </p>
        <Button variant="primary" size="lg" onClick={() => void acceptRules()}>
          J’accepte
        </Button>
      </BottomSheet>
    </>
  )
}
