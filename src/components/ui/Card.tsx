import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-sg-800 border border-sg-600/40 rounded-lg p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-text tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-text-muted mt-1 leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div className="w-full sm:w-auto sm:shrink-0">{action}</div>}
    </div>
  )
}
