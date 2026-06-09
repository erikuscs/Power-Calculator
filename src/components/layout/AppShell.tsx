import { type ReactNode, useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-sg-800 flex flex-col">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
      <footer className="border-t border-sg-600 bg-sg-900 px-4 py-3 text-center text-xs text-text-dim">
        <span className="text-warning/70">⚠</span>{' '}Calculations are estimates for reference only. Always verify with a licensed professional engineer before making design decisions.{' '}
        <span className="text-text-dim">© {new Date().getFullYear()} Sustainable Gaps</span>
      </footer>
    </div>
  )
}
