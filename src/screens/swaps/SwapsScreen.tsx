import { ComingSoon } from '../../components/ComingSoon'
import { ScreenHeader } from '../../components/ScreenHeader'

export function SwapsScreen() {
  return (
    <>
      <ScreenHeader
        title="Échanges"
        subtitle="Troque tes pièces qui dorment contre celles des autres membres, avec des crédits."
      />
      <ComingSoon
        step={4}
        items={['Bourse filtrée sur tes tailles et ta ville', 'Mes échanges et mes annonces', 'Solde de crédits']}
      />
    </>
  )
}
