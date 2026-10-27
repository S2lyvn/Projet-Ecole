import { ComingSoon } from '../../components/ComingSoon'
import { ScreenHeader } from '../../components/ScreenHeader'

export function SummaryScreen() {
  return (
    <>
      <ScreenHeader title="Bilan" subtitle="Un seul chiffre : la part de ton dressing que tu portes vraiment." />
      <ComingSoon
        step={2}
        items={['Anneau : pièces portées sur 3 ou 12 mois', 'Pièces remises en circulation par l’échange']}
      />
    </>
  )
}
