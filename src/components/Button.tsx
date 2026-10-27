import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import type { LinkProps } from 'react-router'

export type ButtonVariant = 'primary' | 'secondary' | 'solid' | 'done'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'border-accent bg-accent font-bold text-on-accent shadow-[var(--shadow-accent)] hover:brightness-110',
  secondary: 'border-outline bg-transparent font-medium text-ink hover:bg-tile',
  solid: 'border-solid bg-solid font-bold text-on-solid hover:brightness-95',
  done: 'border-transparent bg-accent-tint font-bold text-accent-ink',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-11 rounded-xl text-sm',
  md: 'min-h-12 rounded-[14px] text-[15px]',
  lg: 'min-h-14 rounded-[18px] text-[17px] font-bold',
}

/** Classes d'un bouton du design (docs/06-design.md) ; aussi utilisables sur un lien. */
export function buttonClasses(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', fullWidth = true): string {
  return [
    // Léger enfoncement au toucher (désactivé si l'utilisateur réduit les animations, voir index.css).
    'inline-flex items-center justify-center gap-2 border px-4 text-center no-underline transition-[transform,filter,background-color,box-shadow] duration-150 ease-out active:scale-[0.97] disabled:active:scale-100',
    'disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:cursor-not-allowed aria-disabled:opacity-45',
    fullWidth ? 'w-full' : '',
    VARIANTS[variant],
    SIZES[size],
  ].join(' ')
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  children: ReactNode
}

export function Button({ variant, size, fullWidth, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={[buttonClasses(variant, size, fullWidth), className ?? ''].join(' ')} {...rest} />
}

type ButtonLinkProps = LinkProps & { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean }

export function ButtonLink({ variant, size, fullWidth, className, ...rest }: ButtonLinkProps) {
  return <Link className={[buttonClasses(variant, size, fullWidth), className ?? ''].join(' ')} {...rest} />
}

/** Bouton rond à icône seule (retour, fermer) : le libellé est obligatoire pour les lecteurs d'écran. */
export function IconButton({
  label,
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={[
        'grid size-11 flex-none place-items-center rounded-full border border-line bg-surface text-ink shadow-[var(--shadow-sm)] transition-transform active:scale-90',
        className ?? '',
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
