import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { DisclaimerModal } from './components/ui/DisclaimerModal'
import { routes } from './router'

const NotFoundPage = lazy(() => import('./features/legal/NotFoundPage'))

export default function App() {
  return (
    <>
      <DisclaimerModal />
      <AppShell>
        <Suspense fallback={<div className="p-8 text-text-muted">Loading...</div>}>
          <Routes>
            {routes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AppShell>
    </>
  )
}
