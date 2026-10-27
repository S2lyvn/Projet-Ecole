// Réglages lus au build (fichier .env.local en local, variables du workflow GitHub en ligne).

/** Mode démo : données d'exemple locales et panneau de démonstration (avancer d'un jour, mode miroir…). */
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
