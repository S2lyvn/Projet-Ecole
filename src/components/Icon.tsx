// Icônes au trait reprises du prototype. Décoratives : le libellé à côté porte l'information.
const PATHS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
  hanger:
    '<path d="M12 7a2 2 0 1 0-2-2"/><path d="M12 7v2.5L3.5 16a1.5 1.5 0 0 0 1 2.7h15a1.5 1.5 0 0 0 1-2.7L12 9.5"/>',
  swap: '<path d="M4 8h14M14 4l4 4-4 4"/><path d="M20 16H6M10 12l-4 4 4 4"/>',
  out: '<path d="M5 12v7h14v-7"/><path d="M12 15V3M8 7l4-4 4 4"/>',
  bars: '<path d="M5 20V11M12 20V4M19 20v-6"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  contrast: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16a8 8 0 0 0 0-16z" fill="currentColor"/>',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 24, strokeWidth = 1.8 }: { name: IconName; size?: number; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  )
}
