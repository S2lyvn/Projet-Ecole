import { motion } from 'motion/react'
import { useId } from 'react'

/** Onglets segmentés (Bourse / Mes échanges / Mes annonces) : la pastille active glisse d'un onglet à l'autre. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string; badge?: number }[]
  value: T
  onChange: (value: T) => void
}) {
  const id = useId()
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 rounded-2xl bg-tile p-1">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={[
              'relative min-h-11 flex-1 rounded-xl px-1.5 text-sm transition-colors',
              active ? 'font-bold text-ink' : 'font-medium text-muted',
            ].join(' ')}
          >
            {active && (
              <motion.span
                layoutId={`${id}-pill`}
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                className="absolute inset-0 rounded-xl bg-surface shadow-[var(--shadow-sm)]"
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {option.label}
              {option.badge ? (
                <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] leading-5 font-bold text-on-accent">
                  {option.badge}
                </span>
              ) : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}
