// « Qu’as-tu porté hier ? » : confirmation en un geste des pièces de la tenue validée la veille (prototype : confirmScreen()).
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { formatWeekday } from '../../app/format'
import { useWardrobe } from '../../app/WardrobeProvider'
import { Button, ButtonLink } from '../../components/Button'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { GarmentTile } from '../../components/GarmentTile'
import { Icon } from '../../components/Icon'
import { SubScreenHeader } from '../../components/SubScreenHeader'
import { useToast } from '../../components/Toast'
import type { PendingConfirmation } from '../../data/repository'
import { applyWear, isAvailable, isInLaundry } from '../../domain/laundry'
import type { Garment } from '../../domain/types'
import { plural } from '../../domain/wording'

const NBSP = '\u00a0'
const CONFIRM_BUTTON_ID = 'confirm-ok'

export function ConfirmScreen() {
  const { data } = useWardrobe()
  const [saving, setSaving] = useState(false)
  // Pendant l'enregistrement, l'attente est vidée avant la navigation : on garde la dernière pour éviter un flash.
  const lastPending = useRef<PendingConfirmation | null>(data.pending)
  if (data.pending) lastPending.current = data.pending
  const pending = saving ? lastPending.current : data.pending

  return (
    <>
      <SubScreenHeader
        title={`Qu’as-tu porté hier${NBSP}?`}
        subtitle="Déduit de la tenue que tu as validée. Un seul geste pour confirmer."
        backTo="/"
        backLabel="Fermer"
        icon="close"
      />
      {pending ? (
        // La clé remet la sélection à zéro si l'attente change (jour suivant en démo).
        <ConfirmForm
          key={`${pending.wornOn}:${pending.garmentIds.join(',')}`}
          pending={pending}
          onSavingChange={setSaving}
        />
      ) : (
        <>
          <EmptyState title="Rien à confirmer">
            {data.settings.mirrorMode
              ? `Le miroir est actif${NBSP}: tes tenues validées s’enregistrent toutes seules.`
              : `Valide ta tenue du jour${NBSP}: demain matin, tu la confirmeras ici d’un geste.`}
          </EmptyState>
          <ButtonLink to="/" variant="secondary">
            Retour à Aujourd’hui
          </ButtonLink>
        </>
      )}
    </>
  )
}

function ConfirmForm({
  pending,
  onSavingChange,
}: {
  pending: PendingConfirmation
  onSavingChange: (saving: boolean) => void
}) {
  const { data, run } = useWardrobe()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [selected, setSelected] = useState<Set<string>>(() => new Set(pending.garmentIds))
  const [correcting, setCorrecting] = useState(false)
  const [busy, setBusy] = useState(false)

  const byId = useMemo(() => new Map(data.garments.map((g) => [g.id, g])), [data.garments])
  const pendingGarments = useMemo(
    () =>
      pending.garmentIds
        .map((id) => byId.get(id))
        .filter((g): g is Garment => g !== undefined && g.status === 'active'),
    [pending.garmentIds, byId],
  )
  // Autres pièces portables hier : actives, pas au lavage, pas déjà dans la tenue.
  const others = useMemo(
    () => data.garments.filter((g) => isAvailable(g, data.today) && !pending.garmentIds.includes(g.id)),
    [data.garments, data.today, pending.garmentIds],
  )

  // Ordre stable : pièces de la tenue, puis ajouts dans l'ordre du dressing.
  const selectedGarments = [...pendingGarments, ...others].filter((g) => selected.has(g.id))

  function toggle(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function confirm() {
    const ids = selectedGarments.map((g) => g.id)
    if (ids.length === 0 || busy) return
    setBusy(true)
    onSavingChange(true)
    try {
      await run((r) => r.confirmWears(ids))
      navigate('/dressing')
      showToast(`Dressing mis à jour${NBSP}: ${ids.length} ${plural(ids.length, 'pièce', 'pièces')}.`)
    } catch (e) {
      onSavingChange(false)
      setBusy(false)
      showToast(e instanceof Error ? e.message : String(e))
      requestAnimationFrame(() => document.getElementById(CONFIRM_BUTTON_ID)?.focus())
    }
  }

  // Les pièces de la tenue ont toutes quitté le dressing (données, vendues) : on vide l'attente.
  async function clearPending() {
    await run((r) => r.confirmWears([]))
    navigate('/')
  }

  if (pendingGarments.length === 0) {
    return (
      <>
        <EmptyState title="Plus rien à confirmer">
          Les pièces de cette tenue ne sont plus dans ton dressing.
        </EmptyState>
        <Button variant="primary" size="lg" onClick={clearPending}>
          C’est noté
        </Button>
      </>
    )
  }

  function row(garment: Garment) {
    return (
      <label
        key={garment.id}
        className="flex min-h-[68px] cursor-pointer items-center gap-3 border-b border-line last-of-type:border-b-0"
      >
        <input
          type="checkbox"
          className="m-0 size-6 flex-none accent-accent"
          checked={selected.has(garment.id)}
          onChange={(e) => toggle(garment.id, e.target.checked)}
        />
        <GarmentTile garment={garment} size="xs" />
        <span className="min-w-0 flex-1 text-base font-medium">{garment.name}</span>
      </label>
    )
  }

  // Effet sur le dressing : la règle applyWear, qui ne raccourcit jamais un lavage déjà en cours.
  const washed: string[] = []
  const free: string[] = []
  for (const g of selectedGarments) {
    const after = applyWear(g, pending.wornOn)
    if (after.laundryUntil !== null && isInLaundry(after, data.today)) {
      washed.push(`${g.name}, retour ${formatWeekday(after.laundryUntil)}`)
    } else free.push(g.name)
  }

  const fieldsetClasses = 'm-0 flex min-w-0 flex-col rounded-3xl border border-line bg-surface px-4 py-1'

  return (
    <>
      <fieldset className={fieldsetClasses}>
        <legend className="sr-only">Pièces portées hier</legend>
        {pendingGarments.map(row)}
      </fieldset>

      {correcting && (
        <>
          <p className="m-0 text-[13px] font-bold tracking-[0.04em] text-muted uppercase">Ajouter une autre pièce</p>
          <fieldset className={fieldsetClasses}>
            <legend className="sr-only">Autres pièces portées hier</legend>
            {others.length > 0 ? (
              others.map(row)
            ) : (
              <p className="m-0 py-4 text-sm text-muted">Aucune autre pièce disponible.</p>
            )}
          </fieldset>
        </>
      )}

      <Card tone="tint" aria-label="Effet sur le dressing" className="gap-2! rounded-[20px]!">
        <h2 className="m-0 text-[13px] font-bold tracking-[0.04em] text-accent-ink uppercase">
          Ton dressing se met à jour
        </h2>
        {selectedGarments.length === 0 && <p className="m-0">Aucune pièce sélectionnée.</p>}
        {washed.length > 0 && (
          <p className="m-0">
            <strong>{`Au lavage (durée par défaut)${NBSP}:`}</strong> {washed.join(`${NBSP}; `)}.
          </p>
        )}
        {free.length > 0 && (
          <p className="m-0">
            <strong>{`Disponibles${NBSP}:`}</strong> {free.join(', ')}.
          </p>
        )}
      </Card>

      <div className="mt-auto flex flex-col gap-2.5">
        <Button
          id={CONFIRM_BUTTON_ID}
          variant="primary"
          size="lg"
          disabled={selectedGarments.length === 0 || busy}
          onClick={confirm}
        >
          C’est bon
        </Button>
        <Button onClick={() => setCorrecting((c) => !c)}>
          {correcting ? 'Masquer la correction' : 'Corriger'}
        </Button>
        <p className="m-0 flex items-center justify-center gap-2 text-center text-[13px] leading-snug text-pretty text-muted">
          <Icon name="mirror" size={18} />
          <span>
            {data.settings.mirrorMode
              ? `Le miroir est actif${NBSP}: cette étape se fait sans geste.`
              : 'Avec un miroir connecté, cette étape se fait sans geste.'}
          </span>
        </p>
      </div>
    </>
  )
}
