// Écran Vendre (sellScreen() du prototype) : annonce préremplie à copier, puis « Je l’ai vendue ».
// Pas de publication automatique : aucune API Vinted officielle (docs/02-produit.md).
import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useWardrobe } from '../../app/WardrobeProvider'
import { Button, ButtonLink } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { GarmentTile } from '../../components/GarmentTile'
import { Icon } from '../../components/Icon'
import { SubScreenHeader } from '../../components/SubScreenHeader'
import { useToast } from '../../components/Toast'
import { daysSinceLastWear } from '../../domain/dormancy'
import { ITEM_CONDITIONS } from '../../domain/types'
import type { Garment, ItemCondition } from '../../domain/types'
import { CONDITION_LABELS, agree, notWornSince, pronoun } from '../../domain/wording'
import { buildListingText } from './listing'

const SUBTITLE = 'L’annonce est préremplie. Tu la publies sur la plateforme de ton choix.'
const INPUT_CLASS =
  'min-h-[52px] w-full rounded-[14px] border border-outline bg-surface px-3.5 text-base text-ink placeholder:text-muted'
const LABEL_CLASS = 'text-[13px] font-bold'
const SOLD_BUTTON_ID = 'sell-sold'

export function SellScreen() {
  const { garmentId } = useParams()
  const { data } = useWardrobe()
  const garment = data.garments.find((g) => g.id === garmentId)
  // Pendant la vente, la pièce passe à « sold » juste avant de quitter l'écran : on garde le formulaire affiché.
  const [selling, setSelling] = useState(false)

  if (!garment || (garment.status !== 'active' && !selling)) {
    return (
      <>
        <SubScreenHeader title="Vendre cette pièce" backTo="/a-sortir" backLabel="Retour" />
        <EmptyState title="Pièce introuvable">Elle n’est plus dans ton dressing.</EmptyState>
        <ButtonLink to="/a-sortir" variant="secondary">
          Voir les pièces à sortir
        </ButtonLink>
      </>
    )
  }
  return <SellForm key={garment.id} garment={garment} onSellingChange={setSelling} />
}

type CopyState = 'idle' | 'copied' | 'failed'

function SellForm({ garment, onSellingChange }: { garment: Garment; onSellingChange(selling: boolean): void }) {
  const { data, run } = useWardrobe()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [title, setTitle] = useState(garment.name)
  const [size, setSize] = useState(garment.size ?? '')
  const [condition, setCondition] = useState<ItemCondition>('very_good')
  const [price, setPrice] = useState('')
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const listingRef = useRef<HTMLTextAreaElement>(null)

  const listing = buildListingText({ title, size, condition, price })
  const a = garment.agreement
  const isPlural = a.endsWith('p')

  // Toute modification rend l'annonce copiée périmée.
  function edit(setter: (value: string) => void) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value)
      setCopyState('idle')
    }
  }

  async function copy() {
    let ok = false
    try {
      await navigator.clipboard.writeText(listing)
      ok = true
    } catch {
      ok = false
    }
    setCopyState(ok ? 'copied' : 'failed')
    if (ok) {
      showToast('Annonce copiée.')
      document.getElementById(SOLD_BUTTON_ID)?.focus()
    } else {
      // Repli : le texte est sélectionné, prêt à copier à la main.
      showToast('Copie impossible ici\u00a0: sélectionne le texte.')
      listingRef.current?.focus()
      listingRef.current?.select()
    }
  }

  const [selling, setSelling] = useState(false)

  async function markSold() {
    // Un double appui ne doit pas enregistrer deux ventes.
    if (selling) return
    setSelling(true)
    onSellingChange(true)
    try {
      await run((r) => r.setGarmentStatus(garment.id, 'sold'))
    } catch (e) {
      setSelling(false)
      onSellingChange(false)
      showToast(e instanceof Error ? e.message : 'La vente n’a pas pu être enregistrée.')
      return
    }
    navigate('/a-sortir')
    const subject = pronoun(a)
    showToast(
      `${garment.name}\u00a0: ${agree(a, 'vendu')}. ${subject.charAt(0).toUpperCase()}${subject.slice(1)} ${isPlural ? 'quittent' : 'quitte'} ton dressing.`,
      { undo: () => run((r) => r.setGarmentStatus(garment.id, 'active')).then(() => undefined) },
    )
  }

  const listingLabel =
    copyState === 'copied'
      ? 'Annonce copiée'
      : copyState === 'failed'
        ? 'Sélectionne et copie ce texte'
        : 'Aperçu de l’annonce'

  return (
    <>
      <SubScreenHeader title="Vendre cette pièce" subtitle={SUBTITLE} backTo="/a-sortir" backLabel="Retour" />

      <section className="flex items-center gap-3.5 rounded-[20px] border border-line bg-surface p-3">
        <GarmentTile garment={garment} size="lg" />
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="m-0 text-[17px] leading-[1.2] font-bold">{garment.name}</h2>
          <p className="m-0 text-[13px] font-medium text-amber-ink">
            {notWornSince(a, daysSinceLastWear(garment, data.today))}
          </p>
        </div>
      </section>

      <form className="flex flex-col gap-3.5" noValidate onSubmit={(e) => e.preventDefault()}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sell-title" className={LABEL_CLASS}>
            Titre de l’annonce
          </label>
          <input id="sell-title" type="text" className={INPUT_CLASS} value={title} onChange={edit(setTitle)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="sell-size" className={LABEL_CLASS}>
              Taille
            </label>
            <input
              id="sell-size"
              type="text"
              className={INPUT_CLASS}
              placeholder="ex. M"
              value={size}
              onChange={edit(setSize)}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="sell-price" className={LABEL_CLASS}>
              Prix<span className="sr-only"> en euros</span>
            </label>
            <div className="relative">
              <input
                id="sell-price"
                type="text"
                inputMode="decimal"
                className={`${INPUT_CLASS} pr-9`}
                placeholder="ex. 15"
                value={price}
                onChange={edit(setPrice)}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-base text-muted"
              >
                €
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sell-condition" className={LABEL_CLASS}>
            État
          </label>
          <div className="relative">
            <select
              id="sell-condition"
              className={`${INPUT_CLASS} appearance-none pr-10`}
              value={condition}
              onChange={(e) => {
                setCondition(e.target.value as ItemCondition)
                setCopyState('idle')
              }}
            >
              {ITEM_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {CONDITION_LABELS[c]}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
              <span className="flex rotate-90">
                <Icon name="chev" size={20} strokeWidth={2} />
              </span>
            </span>
          </div>
        </div>
      </form>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sell-listing" className={LABEL_CLASS}>
          {listingLabel}
        </label>
        <textarea
          id="sell-listing"
          ref={listingRef}
          readOnly
          rows={3}
          className={`${INPUT_CLASS} min-h-24! resize-none py-3 leading-[1.4]`}
          value={listing}
        />
      </div>

      <div className="mt-auto flex flex-col gap-2.5">
        <Button variant="primary" size="lg" onClick={copy}>
          <Icon name="copy" size={20} strokeWidth={2} />
          Copier l’annonce
        </Button>
        <Button id={SOLD_BUTTON_ID} variant="solid" aria-busy={selling} onClick={markSold}>
          {isPlural ? 'Je les ai' : 'Je l’ai'} {agree(a, 'vendu')}
        </Button>
        <Button onClick={() => showToast('Dans l’appli, ce bouton ouvre ta plateforme de revente.')}>
          Ouvrir ma plateforme de revente
        </Button>
        <p className="m-0 text-center text-[13px] leading-[1.4] text-pretty text-muted">
          Une fois vendue, la pièce sort de ton dressing.
        </p>
      </div>
    </>
  )
}
