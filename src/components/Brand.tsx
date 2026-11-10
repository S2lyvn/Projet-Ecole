// Éléments de la marque DeepIN Armour, découpés dans le logo officiel de la charte graphique (public/brand/).
// Le logo n'est jamais redessiné : on affiche les fichiers d'origine, sur fond transparent.

const BASE = import.meta.env.BASE_URL

/** Proportions du symbole (maison, cintre, lien infini, papillon). */
const SYMBOL_RATIO = 361 / 209
/** Proportions du logo complet (symbole, nom et signature). */
const FULL_RATIO = 547 / 340

/**
 * Symbole du logo. Les traits violets disparaissent sur fond sombre : en thème sombre (--logo-bg),
 * le symbole est posé sur une pastille crème.
 */
export function BrandMark({ height = 30 }: { height?: number }) {
  return (
    <span className="flex-none rounded-lg px-0.5" style={{ background: 'var(--logo-bg)' }}>
      <img
        src={`${BASE}brand/logo-symbole.png`}
        alt=""
        height={height}
        width={Math.round(height * SYMBOL_RATIO)}
        style={{ height, width: 'auto' }}
        className="block"
      />
    </span>
  )
}

/** Logo complet de la charte, avec sa signature « Partager le bonheur dans son armoire ». */
export function BrandLogo({ width = 220 }: { width?: number }) {
  return (
    <span className="inline-block rounded-2xl p-2" style={{ background: 'var(--logo-bg)' }}>
      <img
        src={`${BASE}brand/logo-complet.png`}
        alt="DeepIN Armour : partager le bonheur dans son armoire"
        width={width}
        height={Math.round(width / FULL_RATIO)}
        className="block h-auto max-w-full"
      />
    </span>
  )
}

/** Nom de la marque en toutes lettres (Montserrat, « IN » en jaune soleil), comme dans le logo. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={['font-display font-extrabold tracking-[-0.02em] whitespace-nowrap', className].join(' ')}>
      Deep<span className="text-sun">IN</span> Armour
    </span>
  )
}

/** En-tête compact : symbole du logo et nom. */
export function BrandLockup({ height = 30 }: { height?: number }) {
  return (
    <span className="inline-flex items-center gap-2 text-accent-ink">
      <BrandMark height={height} />
      <Wordmark className="text-[17px]" />
    </span>
  )
}

/** Papillon du logo (transformation, renouveau). */
export function Butterfly({ height = 48 }: { height?: number }) {
  return (
    <img
      src={`${BASE}brand/papillon.png`}
      alt=""
      height={height}
      width={Math.round(height * (97 / 102))}
      style={{ height, width: 'auto' }}
      className="block flex-none"
    />
  )
}
