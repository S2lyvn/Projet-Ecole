import { useWardrobe } from '../../app/WardrobeProvider'
import { ButtonLink } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { Pills } from '../../components/Pills'
import { ScreenHeader } from '../../components/ScreenHeader'
import { computeUsage, countSwapCirculation, formatUsagePercent } from '../../domain/usage'
import type { UsagePeriod } from '../../domain/usage'
import { plural } from '../../domain/wording'
import { UsageRing } from './UsageRing'

const PERIOD_OPTIONS: { value: UsagePeriod; label: string }[] = [
  { value: 90, label: '3 derniers mois' },
  { value: 365, label: '12 derniers mois' },
]

const PERIOD_MONTHS: Record<UsagePeriod, number> = { 90: 3, 365: 12 }

/** Ligne de l'échange (docs/02-produit.md) ; à 0, une formule qui n'accuse personne. */
function swapLine(count: number): string {
  if (count === 0) return 'Aucune pièce échangée pour l’instant. La bourse arrive bientôt.'
  return `${count} ${plural(count, 'pièce remise', 'pièces remises')} en circulation par l’échange`
}

export function SummaryScreen() {
  const { data, run } = useWardrobe()
  const period = data.settings.usagePeriod
  const usage = computeUsage(data.garments, data.today, period)
  const swap = countSwapCirculation(data.garments)
  const months = PERIOD_MONTHS[period]
  const ringLabel = `${usage.worn} ${plural(usage.worn, 'pièce portée', 'pièces portées')} sur ${usage.total} ces ${months} derniers mois`

  return (
    <>
      <ScreenHeader title="Bilan" subtitle={'Un seul chiffre : la part de ton dressing que tu portes vraiment.'} />

      <Pills
        label="Période"
        options={PERIOD_OPTIONS}
        value={period}
        onChange={(value) => {
          if (value !== period) void run((r) => r.updateSettings({ usagePeriod: value }))
        }}
      />

      {/* Pas de Card : rayon et marges propres à l'anneau (prototype .ringbox). */}
      <section
        aria-label="Pièces portées sur la période"
        className="flex flex-col items-center gap-5 rounded-[28px] border border-line bg-surface px-4 py-6"
      >
        <UsageRing worn={usage.worn} total={usage.total} label={ringLabel} />
        <p className="m-0 text-center text-[15px]">
          soit <strong className="tabular-nums">{formatUsagePercent(usage.ratio)}</strong> de ton dressing
        </p>
        <ul className="m-0 flex list-none flex-wrap justify-center gap-6 p-0">
          <li className="flex items-center gap-2 text-sm">
            <span aria-hidden="true" className="size-3.5 rounded bg-accent" />
            Portées
          </li>
          <li className="flex items-center gap-2 text-sm">
            <span aria-hidden="true" className="size-3.5 rounded bg-amber" />
            Pas portées
          </li>
        </ul>
      </section>

      <p className="m-0 flex items-center gap-3 rounded-[20px] border border-line bg-surface p-3 text-[15px] text-pretty">
        <span
          aria-hidden="true"
          className="grid size-10 flex-none place-items-center rounded-full bg-accent-tint text-accent-ink"
        >
          <Icon name="swap" size={22} />
        </span>
        <span className="min-w-0">{swapLine(swap.given + swap.received)}</span>
      </p>

      <ButtonLink to="/a-sortir" variant="solid" size="lg">
        Voir les pièces à sortir
        <Icon name="chev" size={20} />
      </ButtonLink>
    </>
  )
}
