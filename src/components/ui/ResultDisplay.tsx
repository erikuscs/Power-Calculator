import type { ReactNode } from 'react'

interface ResultItemProps {
  label: string
  value: string | number
  unit?: string
  highlight?: boolean
  beforeMargin?: string
}

export function ResultItem({ label, value, unit, highlight, beforeMargin }: ResultItemProps) {
  return (
    <div className={`p-4 rounded-lg border-l-3 ${
      highlight
        ? 'border-l-accent-500 bg-sg-700/60'
        : 'border-l-sg-500 bg-sg-800'
    }`}>
      <div className="text-xs text-text-muted uppercase tracking-wider mb-1.5">{label}</div>
      <div className={`text-xl font-bold tracking-tight ${highlight ? 'text-accent-300' : 'text-text'}`}>
        {value}
        {unit && <span className="text-sm font-normal text-text-muted ml-1.5">{unit}</span>}
      </div>
      {beforeMargin && (
        <div className="text-xs text-text-dim mt-1">Before margin: {beforeMargin}</div>
      )}
    </div>
  )
}

export function ResultGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" role="region" aria-live="polite">
      {children}
    </div>
  )
}
