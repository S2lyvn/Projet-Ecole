import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon } from './Icon'

/** Bannière miel cliquable (« Hier : 3 pièces à confirmer », « 3 achats détectés »). */
export function Banner({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="group flex min-h-[52px] w-full items-center justify-between gap-3 rounded-2xl bg-accent-tint px-4 text-left text-[15px] font-medium text-accent-ink no-underline transition-transform active:scale-[0.98]"
    >
      <span>{children}</span>
      <span className="transition-transform group-hover:translate-x-0.5">
        <Icon name="chev" size={20} strokeWidth={2} />
      </span>
    </Link>
  )
}
