import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import { TabBar } from './TabBar'

export function AppLayout() {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)

  // À chaque changement d'onglet : retour en haut, et le focus va sur le titre (lecteurs d'écran).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    mainRef.current?.scrollTo({ top: 0 })
    document.getElementById('screen-title')?.focus()
  }, [pathname])

  return (
    <div className="min-h-full bg-stage md:py-6">
      <div className="mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden bg-app md:h-[min(864px,calc(100dvh-48px))] md:rounded-[32px] md:border md:border-line">
        <main
          ref={mainRef}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 pt-[max(28px,env(safe-area-inset-top))] pb-5"
        >
          <Outlet />
        </main>
        <TabBar />
      </div>
    </div>
  )
}
