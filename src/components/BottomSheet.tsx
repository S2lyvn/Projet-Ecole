import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

/**
 * Feuille du bas (actions sur une pièce). Repose sur <dialog> : focus piégé, Échap pour fermer,
 * reste de la page inerte. Un appui sur le fond ferme aussi la feuille.
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

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [open])

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
      className="m-0 mx-auto mt-auto w-full max-w-[430px] border-0 border-t border-line bg-surface p-0 text-ink backdrop:bg-[var(--scrim)] rounded-t-3xl"
    >
      {open && <div className="flex flex-col gap-4 px-5 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">{children}</div>}
    </dialog>
  )
}
