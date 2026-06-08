import { Menu, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  return (
    <header className="bg-sg-900 border-b border-sg-600 px-4 py-3 flex items-center gap-4">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-sg-700 text-text-muted"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>
      <Link to="/" className="flex items-center gap-3 no-underline">
        <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
          <Zap size={18} className="text-sg-900" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-text leading-tight">Power Calculator</h1>
          <p className="text-xs text-accent-400 leading-tight">Sustainable Gaps</p>
        </div>
      </Link>
    </header>
  )
}
