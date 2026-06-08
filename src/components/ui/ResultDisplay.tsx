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
    <div className={`p-3 rounded-lg ${highlight ? 'bg-accent-500/10 border border-accent-500/30' : 'bg-sg-800'}`}>
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className={`text-lg font-semibold ${highlight ? 'text-accent-300' : 'text-text'}`}>
        {value}
        {unit && <span className="text-sm font-normal text-text-muted ml-1">{unit}</span>}
      </div>
      {beforeMargin && (
        <div className="text-xs text-text-dim mt-0.5">Before margin: {beforeMargin}</div>
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
