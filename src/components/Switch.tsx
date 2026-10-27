import { motion } from 'motion/react'

/** Interrupteur accessible (role switch), 48 px de haut, bouton qui glisse avec un ressort. */
export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-12 w-full items-center justify-between gap-3 text-left text-[15px] font-medium text-ink"
    >
      <span className="flex flex-col">
        <span>{label}</span>
        {description && <span className="text-[13px] font-normal text-muted">{description}</span>}
      </span>
      <span
        aria-hidden="true"
        className={[
          'relative flex h-7 w-12 flex-none items-center rounded-full p-[3px] transition-colors duration-200',
          checked ? 'justify-end bg-accent' : 'justify-start bg-outline',
        ].join(' ')}
      >
        <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 32 }} className="size-[22px] rounded-full bg-surface shadow-sm" />
      </span>
    </button>
  )
}
