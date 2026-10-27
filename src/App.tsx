import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { WardrobeProvider } from './app/WardrobeProvider'
import { AppLayout } from './components/AppLayout'
import { ToastProvider } from './components/Toast'
import { repository } from './data'
import { ConfirmScreen } from './screens/confirm/ConfirmScreen'
import { PurchasesScreen } from './screens/purchases/PurchasesScreen'
import { SellScreen } from './screens/sell/SellScreen'
import { SummaryScreen } from './screens/summary/SummaryScreen'
import { SwapsScreen } from './screens/swaps/SwapsScreen'
import { ToSortScreen } from './screens/to-sort/ToSortScreen'
import { TodayScreen } from './screens/today/TodayScreen'
import { WardrobeScreen } from './screens/wardrobe/WardrobeScreen'

// BASE_URL vaut « / » en local et « /Projet-Ecole/ » sur GitHub Pages.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

/** Les écrans, sans le routeur ni les données : réutilisé par les tests avec un MemoryRouter. */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<TodayScreen />} />
        <Route path="dressing" element={<WardrobeScreen />} />
        <Route path="echanges" element={<SwapsScreen />} />
        <Route path="a-sortir" element={<ToSortScreen />} />
        <Route path="bilan" element={<SummaryScreen />} />
      </Route>
      <Route element={<AppLayout withTabs={false} />}>
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
    <BrowserRouter basename={basename}>
      <WardrobeProvider repository={repository}>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </WardrobeProvider>
    </BrowserRouter>
  )
}
