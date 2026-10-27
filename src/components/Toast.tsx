// Message bref en bas de l'écran, avec « Annuler » pour les actions destructrices (donner, vendre…).
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface ToastState {
  id: number
  message: string
  undo?: () => void | Promise<void>
}

interface ToastContextValue {
  toast: ToastState | null
  showToast(message: string, options?: { undo?: () => void | Promise<void> }): void
  hideToast(): void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const nextId = useRef(1)

  const showToast = useCallback<ToastContextValue['showToast']>((message, options) => {
    setToast({ id: nextId.current++, message, undo: options?.undo })
  }, [])
  const hideToast = useCallback(() => setToast(null), [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast((t) => (t?.id === toast.id ? null : t)), toast.undo ? 7000 : 3500)
    return () => clearTimeout(timer)
  }, [toast])

  return <ToastContext.Provider value={{ toast, showToast, hideToast }}>{children}</ToastContext.Provider>
}

export function useToast(): Pick<ToastContextValue, 'showToast' | 'hideToast'> {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast doit être utilisé dans <ToastProvider>')
  return { showToast: value.showToast, hideToast: value.hideToast }
}

/** Zone d'affichage, placée dans le cadre de l'appli (au-dessus de la barre d'onglets). */
export function ToastHost({ withTabs }: { withTabs: boolean }) {
  const value = useContext(ToastContext)
  const toast = value?.toast
  return (
    <div
      role="status"
      aria-live="polite"
      className={['pointer-events-none absolute inset-x-4 z-20', withTabs ? 'bottom-24' : 'bottom-5'].join(' ')}
    >
      {toast && (
        <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-[14px] bg-solid px-3.5 py-3 text-sm font-medium text-on-solid">
          <span>{toast.message}</span>
          {toast.undo && (
            <button
              type="button"
              className="min-h-11 flex-none px-2 text-sm font-bold underline"
              onClick={async () => {
                const undo = toast.undo
                value?.hideToast()
                await undo?.()
                // Le bouton a disparu avec le toast : le focus revient au titre de l'écran.
                document.getElementById('screen-title')?.focus()
              }}
            >
              Annuler
            </button>
          )}
        </div>
      )}
    </div>
  )
}
