import { MotionConfig } from 'motion/react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { WardrobeProvider } from './app/WardrobeProvider'
import { AppLayout } from './components/AppLayout'
import { ToastProvider } from './components/Toast'
import { repository } from './data'
import { ConfirmScreen } from './screens/confirm/ConfirmScreen'
import { PurchasesScreen } from './screens/purchases/PurchasesScreen'
import { SellScreen } from './screens/sell/SellScreen'
import { MapScreen } from './screens/map/MapScreen'
import { ListingScreen } from './screens/swaps/ListingScreen'
import { ProposeScreen } from './screens/swaps/ProposeScreen'
import { SwapScreen } from './screens/swaps/SwapScreen'
import { SwapsScreen } from './screens/swaps/SwapsScreen'
import { TodayScreen } from './screens/today/TodayScreen'
import { WardrobeScreen } from './screens/wardrobe/WardrobeScreen'

// L'appli vit dans /app/ : la racine du site est la page vitrine (index.html).
// BASE_URL vaut « / » en local et « /Projet-Ecole/ » sur GitHub Pages.
const basename = `${import.meta.env.BASE_URL}app`

/** Les écrans, sans le routeur ni les données : réutilisé par les tests avec un MemoryRouter. */
export function AppRoutes() {
  return (
    <Routes>
      {/* Une seule mise en page : AppLayout masque la barre d'onglets sur les écrans secondaires (app/navigation). */}
      <Route element={<AppLayout />}>
        <Route index element={<MapScreen />} />
        <Route path="echanges" element={<SwapsScreen />} />
        <Route path="armoire" element={<WardrobeScreen />} />
        <Route path="looks" element={<TodayScreen />} />
        <Route path="echanges/annonce/:listingId" element={<ListingScreen />} />
        <Route path="echanges/proposer/:garmentId" element={<ProposeScreen />} />
        <Route path="echanges/echange/:swapId" element={<SwapScreen />} />
        {/* Anciennes adresses (liens enregistrés, vitrine) : elles mènent aux nouveaux écrans. */}
        <Route path="dressing" element={<Navigate to="/armoire" replace />} />
        <Route path="a-sortir" element={<Navigate to="/armoire?filtre=dort" replace />} />
        <Route path="bilan" element={<Navigate to="/armoire" replace />} />
        <Route path="confirmer" element={<ConfirmScreen />} />
        <Route path="achats" element={<PurchasesScreen />} />
        <Route path="vendre/:garmentId" element={<SellScreen />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export function App() {
  return (
    // reducedMotion="user" : si le téléphone demande moins d'animations, Motion coupe les mouvements.
    <MotionConfig reducedMotion="user">
      <BrowserRouter basename={basename}>
        <WardrobeProvider repository={repository}>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </WardrobeProvider>
      </BrowserRouter>
    </MotionConfig>
  )
}
