// Mesure d'audience Umami (sans cookie). Le script est chargé dans app/index.html ; ici, on envoie des événements.
// L'origine du visiteur (UTM, lieu) arrive dans l'adresse depuis la landing et est gardée le temps de la visite.

type UmamiWindow = Window & { umami?: { track: (name: string, data?: Record<string, string>) => void } }

const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'lieu', 'from']

function origin(): Record<string, string> {
  const out: Record<string, string> = {}
  try {
    const stored = JSON.parse(sessionStorage.getItem('dia.origin') ?? '{}') as Record<string, string>
    const params = new URLSearchParams(window.location.search)
    for (const k of KEYS) {
      const v = params.get(k) ?? stored[k]
      if (v) out[k] = v
    }
    sessionStorage.setItem('dia.origin', JSON.stringify(out))
  } catch {
    /* stockage bloqué : on envoie sans origine */
  }
  return out
}

/** Envoie un événement ; ne fait rien si le script de mesure est absent ou bloqué. */
export function track(name: string, data: Record<string, string> = {}) {
  ;(window as UmamiWindow).umami?.track(name, { ...origin(), ...data })
}
