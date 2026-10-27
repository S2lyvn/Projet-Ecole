import { AnimatePresence, motion, useDragControls } from 'motion/react'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

/**
 * Feuille du bas (actions sur une pièce, démo, règles). Repose sur <dialog> : focus piégé, Échap pour fermer,
 * reste de la page inerte. Elle monte avec un ressort, se ferme d'un appui sur le fond ou en la tirant
 * vers le bas par sa poignée.
 */
export function BottomSheet({
  open,
  onClose,
  labelledBy,
  children,
}: {
  open: boolean
  onClose: () => void
  /** id du titre de la feuille. */
  labelledBy: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const drag = useDragControls()

  // Ouverture immédiate ; la fermeture du <dialog> attend la fin de l'animation de sortie (closeDialog).
  useEffect(() => {
    const dialog = ref.current
    if (!dialog || !open || dialog.open) return
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '')
  }, [open])

  function closeDialog() {
    const dialog = ref.current
    if (!dialog?.open) return
    if (typeof dialog.close === 'function') dialog.close()
    else dialog.removeAttribute('open')
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      className="m-0 mx-auto mt-auto max-h-[92dvh] w-full max-w-[430px] overflow-visible border-0 bg-transparent p-0 text-ink backdrop:bg-[var(--scrim)]"
    >
      <AnimatePresence onExitComplete={closeDialog}>
        {open && (
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0, transition: { type: 'spring', stiffness: 380, damping: 36 } }}
            exit={{ y: '100%', transition: { duration: 0.2, ease: 'easeIn' } }}
            drag="y"
            dragListener={false}
            dragControls={drag}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 500) onClose()
            }}
            className="flex max-h-[92dvh] flex-col rounded-t-[28px] border-t border-line bg-surface shadow-[var(--shadow-md)]"
          >
            {/* Poignée : on peut tirer la feuille vers le bas pour la fermer. */}
            <div
              aria-hidden="true"
              onPointerDown={(event) => drag.start(event)}
              className="flex h-6 flex-none cursor-grab touch-none items-center justify-center active:cursor-grabbing"
            >
              <span className="h-1.5 w-10 rounded-full bg-line" />
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-[max(24px,env(safe-area-inset-bottom))]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </dialog>
  )
}
