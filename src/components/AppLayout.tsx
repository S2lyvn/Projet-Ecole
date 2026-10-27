import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import { isDemoMode } from '../app/config'
import { DemoPanel } from '../demo/DemoPanel'
import { TabBar } from './TabBar'
import { ToastHost } from './Toast'

/** Cadre de l'appli. withTabs = false pour les écrans secondaires (confirmation, achats, vendre). */
export function AppLayout({ withTabs = true }: { withTabs?: boolean }) {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)

  // À chaque changement d'écran : retour en haut, et le focus va sur le titre (lecteurs d'écran).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (mainRef.current) mainRef.current.scrollTop = 0
    document.getElementById('screen-title')?.focus()
  }, [pathname])

  return (
    <div className="flex min-h-full items-start justify-center gap-8 bg-stage md:py-6">
      <div className="relative flex h-dvh w-full max-w-[430px] flex-none flex-col overflow-hidden bg-app md:h-[min(864px,calc(100dvh-48px))] md:rounded-[32px] md:border md:border-line">
        <main
          ref={mainRef}
          className={[
            'flex flex-1 flex-col gap-4 overflow-y-auto px-5 pt-[max(28px,env(safe-area-inset-top))]',
            // En démo sur mobile, le bouton flottant « Démo » ne doit jamais masquer la fin de l'écran.
            isDemoMode && withTabs ? 'pb-20 lg:pb-5' : 'pb-5',
          ].join(' ')}
        >
          <Outlet />
        </main>
        {withTabs && <TabBar />}
        <ToastHost withTabs={withTabs} />
      </div>
      {isDemoMode && <DemoPanel />}
    </div>
  )
}
