import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AppLayout } from './components/AppLayout'
import { SummaryScreen } from './screens/summary/SummaryScreen'
import { SwapsScreen } from './screens/swaps/SwapsScreen'
import { ToSortScreen } from './screens/to-sort/ToSortScreen'
import { TodayScreen } from './screens/today/TodayScreen'
import { WardrobeScreen } from './screens/wardrobe/WardrobeScreen'

// BASE_URL vaut « / » en local et « /Projet-Ecole/ » sur GitHub Pages.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<TodayScreen />} />
          <Route path="dressing" element={<WardrobeScreen />} />
          <Route path="echanges" element={<SwapsScreen />} />
          <Route path="a-sortir" element={<ToSortScreen />} />
          <Route path="bilan" element={<SummaryScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
