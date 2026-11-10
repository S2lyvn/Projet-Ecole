// Symboles de la marque DeepIN Armour (charte graphique) : cintre-cœur et lien infini, maison, papillon.
// Décoratifs : le nom « DeepIN Armour » est écrit en toutes lettres à côté.
import { useId } from 'react'

/** Cintre traversé par le lien infini (partage, circularité, continuité). Dégradé violet vers jaune soleil. */
export function BrandMark({ size = 28 }: { size?: number }) {
  const gradient = useId()
  return (
    <svg
      viewBox="0 0 48 40"
      width={size}
      height={Math.round((size * 40) / 48)}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="flex-none"
    >
      <defs>
        <linearGradient id={gradient} x1="6" y1="0" x2="42" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--accent-ink)" />
          <stop offset="1" stopColor="var(--sun)" />
        </linearGradient>
      </defs>
      <g stroke="var(--accent-ink)" strokeWidth="2.6">
        <path d="M24 12a4 4 0 1 0-4-4" />
        <path d="M24 12v4.500L7 30a3 3 0 0 0 2 5.400h30a3 3 0 0 0 2-5.400L24 16.500" />
      </g>
      <path
        d="M24 28c-5-8-17-8-17 0s12 8 17 0c5-8 17-8 17 0s-12 8-17 0z"
        stroke={`url(#${gradient})`}
        strokeWidth="3"
      />
    </svg>
  )
}

/** Nom de la marque : « IN » en jaune soleil, comme sur le logo. Le reste suit la couleur du texte. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={['font-display font-extrabold tracking-[-0.02em] whitespace-nowrap', className].join(' ')}>
      Deep<span className="text-sun">IN</span> Armour
    </span>
  )
}

/** Marque complète : symbole et nom. */
export function BrandLockup({ size = 26 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2 text-accent-ink">
      <BrandMark size={size} />
      <Wordmark className="text-[17px]" />
    </span>
  )
}

/** Papillon (transformation, renouveau). Ailes jaunes, contour violet. */
export function Butterfly({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 48" width={size} height={Math.round(size * 0.75)} aria-hidden="true" focusable="false">
      <g stroke="var(--accent-ink)" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
        <path d="M31 23C27 9 15 2 7 5 2 7 3 18 9 25c5 5 14 3 22-2z" fill="var(--sun)" />
        <path d="M31 25c-7-3-17-1-19 7-1 6 5 12 11 10 6-2 8-10 8-17z" fill="var(--sun)" fillOpacity=".75" />
        <path d="M33 23C37 9 49 2 57 5c5 2 4 13-2 20-5 5-14 3-22-2z" fill="var(--sun)" />
        <path d="M33 25c7-3 17-1 19 7 1 6-5 12-11 10-6-2-8-10-8-17z" fill="var(--sun)" fillOpacity=".75" />
        <path d="M32 14c1.400 0 1.800 2 1.800 5v14c0 3-.8 5-1.800 5s-1.800-2-1.800-5V19c0-3 .4-5 1.800-5z" fill="var(--accent-ink)" />
        <path d="M31.500 14c-1-4-3-6.500-6-8M32.500 14c1-4 3-6.500 6-8" fill="none" />
      </g>
    </svg>
  )
}
