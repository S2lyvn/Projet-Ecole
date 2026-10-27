import { AnimatePresence, motion } from 'motion/react'
import { useRef } from 'react'
import { useLocation, useOutlet } from 'react-router'
import { isDemoMode } from '../app/config'
import { isSecondaryPath, transitionDirection } from '../app/navigation'
import { DemoPanel } from '../demo/DemoPanel'
import { TabBar } from './TabBar'
import { ToastHost } from './Toast'

// Glissement + fondu entre écrans : l'écran sortant part vite, l'entrant arrive avec un ressort.
const page = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 28 }),
  center: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 420, damping: 36, mass: 0.8 } },
  exit: (direction: number) => ({ opacity: 0, x: direction * -18, transition: { duration: 0.12, ease: 'easeIn' as const } }),
}

/** Cadre de l'appli : écran courant animé, barre d'onglets (masquée sur les écrans secondaires), toasts. */
export function AppLayout() {
  const location = useLocation()
  const outlet = useOutlet()
  const mainRef = useRef<HTMLElement>(null)
  const previousPath = useRef(location.pathname)
  const withTabs = !isSecondaryPath(location.pathname)

  // Sens calculé une fois par changement d'écran.
  const direction = transitionDirection(previousPath.current, location.pathname)
  if (previousPath.current !== location.pathname) previousPath.current = location.pathname

  // Quand l'ancien écran est sorti (jamais au premier affichage) : retour en haut, focus sur le nouveau titre.
  function onScreenReady() {
    if (mainRef.current) mainRef.current.scrollTop = 0
    document.getElementById('screen-title')?.focus()
  }

  return (
    <div className="flex min-h-full items-start justify-center gap-8 bg-stage md:py-6">
      <div className="relative flex h-dvh w-full max-w-[430px] flex-none flex-col overflow-hidden bg-app md:h-[min(864px,calc(100dvh-48px))] md:rounded-[32px] md:border md:border-line md:shadow-[var(--shadow-md)]">
        <main
          ref={mainRef}
          className={[
            'flex flex-1 flex-col overflow-x-hidden overflow-y-auto px-5 pt-[max(28px,env(safe-area-inset-top))]',
            // En démo sur mobile, le bouton flottant « Démo » ne doit jamais masquer la fin de l'écran.
            isDemoMode && withTabs ? 'pb-20 lg:pb-5' : 'pb-5',
          ].join(' ')}
        >
          <AnimatePresence mode="wait" custom={direction} initial={false} onExitComplete={onScreenReady}>
            <motion.div
              key={location.pathname}
              custom={direction}
              variants={page}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-1 flex-col gap-4"
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
        <AnimatePresence initial={false}>
          {withTabs && (
            <motion.div
              key="tabs"
              initial={{ y: '100%' }}
              animate={{ y: 0, transition: { type: 'spring', stiffness: 420, damping: 38 } }}
              exit={{ y: '100%', transition: { duration: 0.16 } }}
            >
              <TabBar />
            </motion.div>
          )}
        </AnimatePresence>
        <ToastHost withTabs={withTabs} />
      </div>
      {isDemoMode && <DemoPanel />}
    </div>
  )
}
