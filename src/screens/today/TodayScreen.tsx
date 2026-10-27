import { ComingSoon } from '../../components/ComingSoon'
import { ScreenHeader } from '../../components/ScreenHeader'

const longDate = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

export function TodayScreen() {
  const today = longDate.format(new Date())
  return (
    <>
      <ScreenHeader eyebrow={today.charAt(0).toUpperCase() + today.slice(1)} title="Tenue du jour" />
      <ComingSoon
        step={2}
        items={[
          'La pièce orpheline du jour et 1 à 2 valeurs sûres',
          'Je porte cette tenue, Autre proposition, Pas aujourd’hui',
          'Bannière «\u00a0Hier\u00a0: X pièces à confirmer\u00a0»',
        ]}
      />
    </>
  )
}
