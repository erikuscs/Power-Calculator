import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { DisclaimerModal } from './components/ui/DisclaimerModal'
import { routes } from './router'

const NotFoundPage = lazy(() => import('./features/legal/NotFoundPage'))

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
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
