import { ComingSoon } from '../../components/ComingSoon'
import { ScreenHeader } from '../../components/ScreenHeader'

export function ToSortScreen() {
  return (
    <>
      <ScreenHeader
        title="À sortir"
        subtitle="Des pièces que tu ne portes plus depuis longtemps. À toi de décider."
      />
      <ComingSoon
        step={2}
        items={['Seuil de dormance : 3, 6 ou 12 mois', 'Remettre en jeu, Échanger, Vendre, Donner']}
      />
    </>
  )
}
