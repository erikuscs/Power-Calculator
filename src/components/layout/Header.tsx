import { useState, useEffect } from 'react'
import { Menu, ShieldCheck, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { APP_BRAND } from '../../lib/brand'

export function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
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
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-sg-700 text-text-muted"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>
      <Link to="/" className="flex items-center gap-3 no-underline">
        <div className="w-9 h-9 bg-accent-500 rounded-lg flex items-center justify-center">
          <Zap size={18} className="text-sg-900" />
        </div>
        <div>
          <h1 className="text-base font-bold text-text leading-tight tracking-tight">{APP_BRAND.productName}</h1>
          <p className="text-[11px] text-accent-400 leading-tight mt-0.5">{APP_BRAND.descriptor}</p>
        </div>
      </Link>
      {!isOnline && (
        <span className="ml-2 px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full bg-sg-700 text-text-dim border border-sg-600/40">
          Offline
        </span>
      )}
      <div className="ml-auto hidden items-center gap-2 rounded-lg border border-sg-600/50 bg-sg-800/70 px-3 py-2 text-xs text-text-muted md:flex">
        <ShieldCheck size={14} className="text-signal-blue" />
        <span>Estimates — PE verification required</span>
      </div>
    </header>
  )
}
