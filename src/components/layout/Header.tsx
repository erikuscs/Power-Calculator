import { useState, useEffect } from 'react'
import { ArrowLeft, Menu, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { APP_BRAND } from '../../lib/brand'

export function Header({
  onMenuToggle,
  menuOpen,
}: {
  onMenuToggle: () => void
  menuOpen: boolean
}) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return (
    <header className="bg-sg-900 border-b border-sg-600/30 px-5 py-4 flex items-center gap-4">
      <button
        type="button"
        onClick={onMenuToggle}
        className="flex h-11 w-11 items-center justify-center rounded-lg text-text-muted hover:bg-sg-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70 lg:hidden"
        aria-label="Toggle menu"
        aria-controls="emaas-navigation"
        aria-expanded={menuOpen}
      >
        <Menu size={20} />
      </button>
      <Link
        to="/"
        className="flex shrink-0 items-center no-underline"
        aria-label={`${APP_BRAND.firstReference} home`}
      >
        <img
          src="/brand/sg-logo-horizontal-reversed-dark.svg"
          alt="Sustainable Gaps"
          width="160"
          height="31"
          className="h-auto w-40"
        />
      </Link>
      {!isOnline && (
        <span className="ml-2 px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full bg-sg-700 text-text-dim border border-sg-600/40">
          Offline
        </span>
      )}
      <a
        href="https://www.sustainablegaps.com/emaas/"
        className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-lg border border-sg-600/50 bg-sg-800/70 px-3 text-xs font-semibold text-text-muted no-underline transition-colors hover:border-accent-400/55 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70"
        aria-label="Back to Sustainable Gaps"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        <span className="hidden sm:inline">Sustainable Gaps</span>
      </a>
      <div className="hidden items-center gap-2 rounded-lg border border-sg-600/50 bg-sg-800/70 px-3 py-2 text-xs text-text-muted md:flex">
        <ShieldCheck size={14} className="text-signal-blue" />
        <span>Estimates — PE verification required</span>
      </div>
    </header>
  )
}
