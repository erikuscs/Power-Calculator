import { type ReactNode, useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-sg-900 flex flex-col">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-5 md:p-8 lg:p-10 overflow-auto">
          {children}
        </main>
      </div>
      <footer className="border-t border-sg-600/50 bg-sg-900 px-6 py-4 text-center text-xs text-text-dim leading-relaxed">
        Calculations are estimates for reference only. Always verify with a licensed professional engineer before making design decisions.
        <br className="sm:hidden" />
        <span className="sm:ml-2">© {new Date().getFullYear()} Sustainable Gaps</span>
      </footer>
    </div>
  )
}
