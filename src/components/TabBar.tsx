import { NavLink } from 'react-router'
import { Icon, type IconName } from './Icon'

type Tab = { to: string; label: string; icon: IconName }

export const TABS: Tab[] = [
  { to: '/', label: 'Aujourd’hui', icon: 'sun' },
  { to: '/dressing', label: 'Dressing', icon: 'hanger' },
  { to: '/echanges', label: 'Échanges', icon: 'swap' },
  { to: '/a-sortir', label: 'À sortir', icon: 'out' },
  { to: '/bilan', label: 'Bilan', icon: 'bars' },
]

export function TabBar() {
  return (
    <nav
      aria-label="Navigation principale"
      className="flex gap-0.5 border-t border-line bg-surface px-1.5 pt-2 pb-[max(14px,env(safe-area-inset-bottom))]"
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            [
              'flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[14px] text-[11px] leading-none tracking-[-0.01em]',
              isActive ? 'bg-accent-tint font-bold text-accent-ink' : 'font-medium text-muted',
            ].join(' ')
          }
        >
          <Icon name={tab.icon} />
          <span className="max-w-full truncate">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
