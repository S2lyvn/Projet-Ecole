import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { IconButton } from './Button'
import { Icon } from './Icon'

/** En-tête des écrans secondaires (sans barre d'onglets) : bouton retour ou fermer, titre, sous-titre. */
export function SubScreenHeader({
  title,
  subtitle,
  backTo,
  backLabel,
  icon = 'back',
}: {
  title: string
  subtitle?: ReactNode
  /** Écran de retour, ex. « /dressing ». */
  backTo: string
  /** Ex. « Retour au dressing », « Fermer ». */
  backLabel: string
  icon?: 'back' | 'close'
}) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col gap-3">
      <IconButton label={backLabel} onClick={() => navigate(backTo)}>
        <Icon name={icon} size={22} strokeWidth={2} />
      </IconButton>
      <header className="flex flex-col gap-1.5">
        <h1
          id="screen-title"
          tabIndex={-1}
          className="m-0 font-display text-[32px] leading-[1.05] font-bold tracking-[-0.02em] text-balance"
        >
          {title}
        </h1>
        {subtitle && <p className="m-0 text-[15px] text-pretty text-muted">{subtitle}</p>}
      </header>
    </div>
  )
}
