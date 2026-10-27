/** Groupe de pastilles (filtres, seuils, périodes) : une seule active, 44 px de haut. */
export function Pills<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-2">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={[
              'min-h-11 flex-1 rounded-full border px-2 text-sm',
              active ? 'border-accent bg-accent font-bold text-on-accent' : 'border-outline font-medium text-ink',
            ].join(' ')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
