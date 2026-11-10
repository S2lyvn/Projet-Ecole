// Icônes au trait reprises du prototype. Décoratives : le libellé à côté porte l'information.
const PATHS = {
  // Bibliothèque d'icônes de la charte DeepIN Armour (fonctions clés)
  wardrobe: '<rect x="4" y="3" width="16" height="18" rx="1.500"/><path d="M12 3v18M9.500 11v2.500M14.500 11v2.500M6.500 21v1.500M17.500 21v1.500"/>',
  looks:
    '<path d="M10 10a2 2 0 1 0-2-2"/><path d="M10 10v1.500L3.500 16.500a1.200 1.200 0 0 0 .8 2.100h11.400a1.200 1.200 0 0 0 .8-2.100L10 11.500"/><path d="M18 2.500v4M16 4.500h4M20.500 9.500v2.400M19.300 10.700h2.400"/>',
  circulate:
    '<path d="M9.500 8.500 7.500 10l1 2 1.500-.5V17h4v-5.500l1.500.5 1-2-2-1.500c-.5 1-1.200 1.500-2.500 1.500s-2-.5-2.500-1.500z"/><path d="M4 12a8 8 0 0 1 13.500-5.800M20 12a8 8 0 0 1-13.500 5.800M17.500 2.500v3.700h-3.700M6.500 21.500v-3.700h3.700"/>',
  community:
    '<circle cx="12" cy="7" r="2.500"/><path d="M7.500 19c0-3 2-5 4.500-5s4.500 2 4.500 5"/><circle cx="5" cy="10.500" r="2"/><path d="M1.500 18.500c0-2.300 1.300-3.800 3.500-3.800"/><circle cx="19" cy="10.500" r="2"/><path d="M22.500 18.500c0-2.300-1.300-3.800-3.500-3.800"/>',
  impact:
    '<path d="M3.500 21v-6M8.500 21v-9.500M13.500 21v-6M3 21h11"/><path d="M17 13.500c0-4.500 2-7 5-7 0 3.500-1.800 6.300-5 7zM17 13.500V21"/>',
  infinity: '<path d="M12 12c-2.500-4-8-4-8 0s5.500 4 8 0c2.500-4 8-4 8 0s-5.500 4-8 0z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
  hanger:
    '<path d="M12 7a2 2 0 1 0-2-2"/><path d="M12 7v2.5L3.5 16a1.5 1.5 0 0 0 1 2.7h15a1.5 1.5 0 0 0 1-2.7L12 9.5"/>',
  swap: '<path d="M4 8h14M14 4l4 4-4 4"/><path d="M20 16H6M10 12l-4 4 4 4"/>',
  out: '<path d="M5 12v7h14v-7"/><path d="M12 15V3M8 7l4-4 4 4"/>',
  bars: '<path d="M5 20V11M12 20V4M19 20v-6"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  contrast: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16a8 8 0 0 0 0-16z" fill="currentColor"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  mirror: '<rect x="6" y="3" width="12" height="18" rx="6"/><path d="M10 8c1-1 3-1 4 0"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  play: '<path d="M8 5v14l11-7z"/>',
  scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M7 12h10"/>',
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
      className="flex-none"
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  )
}
