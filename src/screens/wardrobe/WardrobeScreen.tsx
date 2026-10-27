import { ComingSoon } from '../../components/ComingSoon'
import { ScreenHeader } from '../../components/ScreenHeader'

export function WardrobeScreen() {
  return (
    <>
      <ScreenHeader title="Dressing" subtitle="Ce que tu peux vraiment porter aujourd’hui." />
      <ComingSoon
        step={2}
        items={[
          'Grille des pièces, filtres Tout, Disponible, Au lavage',
          'Fiche d’une pièce : lavage, proposer, échanger, vendre, donner',
          'Achats détectés à confirmer',
        ]}
      />
    </>
  )
}
