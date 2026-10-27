import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'section' | 'article' | 'div'
  tone?: 'default' | 'tint'
  tight?: boolean
}

/** Carte du design : rayon 24 px, bordure --line, marge interne 16 px. */
export function Card({ as: Tag = 'section', tone = 'default', tight = false, className, ...rest }: CardProps) {
  const toneClasses = tone === 'tint' ? 'border-transparent bg-accent-tint' : 'border-line bg-surface shadow-[var(--shadow-sm)]'
  const sizeClasses = tight ? 'gap-2.5 rounded-[20px] p-3' : 'gap-3.5 rounded-3xl p-4'
  return <Tag className={['flex flex-col border', toneClasses, sizeClasses, className ?? ''].join(' ')} {...rest} />
}
