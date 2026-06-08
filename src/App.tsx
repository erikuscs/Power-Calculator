import { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { routes } from './router'

export default function App() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-text-muted">Loading...</div>}>
        <Routes>
          {routes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Routes>
      </Suspense>
    </AppShell>
  )
}
