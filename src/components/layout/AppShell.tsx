import { type ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { APP_BRAND } from '../../lib/brand'

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
        {APP_BRAND.productName} outputs are planning estimates for reference only. Always verify with a licensed professional engineer before making design decisions.
        <br className="sm:hidden" />
        <span className="sm:ml-2">© {new Date().getFullYear()} {APP_BRAND.reportBrand}</span>
        <span className="mx-2 text-sg-600">·</span>
        <Link to="/privacy" className="text-text-dim hover:text-accent-400 no-underline">Privacy</Link>
      </footer>
    </div>
  )
}
