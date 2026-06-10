import { useState, useEffect } from 'react'
import { Menu, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

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
          <h1 className="text-base font-bold text-text leading-tight tracking-tight">Power Calculator</h1>
          <p className="text-[11px] text-accent-400 uppercase tracking-widest leading-tight mt-0.5">Sustainable Gaps</p>
        </div>
      </Link>
      {!isOnline && (
        <span className="ml-2 px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full bg-sg-700 text-text-dim border border-sg-600/40">
          Offline
        </span>
      )}
    </header>
  )
}
