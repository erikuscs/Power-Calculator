import type { ReactNode } from 'react'
import { CheckCircle2, ClipboardCheck, Route, ShieldAlert, type LucideIcon } from 'lucide-react'
import { Card, CardHeader } from './Card'

export type SpecSummaryTone = 'success' | 'warning' | 'info' | 'neutral'

export interface SpecSummaryMetric {
  label: string
  value: string
  detail?: string
}

export interface SpecSummaryStep {
  label: string
  detail: string
}

interface SpecSummaryPanelProps {
  title: string
  subtitle: string
  statusLabel: string
  statusTone?: SpecSummaryTone
  metrics: SpecSummaryMetric[]
  steps: SpecSummaryStep[]
  notes?: string[]
  action?: ReactNode
}

const statusClasses: Record<SpecSummaryTone, string> = {
  success: 'border-success/35 bg-success/10 text-success',
  warning: 'border-warning/35 bg-warning/10 text-warning',
  info: 'border-info/35 bg-info/10 text-info',
  neutral: 'border-sg-600/45 bg-sg-900/70 text-text-muted',
}

const statusIcons: Record<SpecSummaryTone, LucideIcon> = {
  success: CheckCircle2,
  warning: ShieldAlert,
  info: ClipboardCheck,
  neutral: ClipboardCheck,
}

export function SpecSummaryPanel({
  title,
  subtitle,
  statusLabel,
  statusTone = 'info',
  metrics,
  steps,
  notes = [],
  action,
}: SpecSummaryPanelProps) {
  const StatusIcon = statusIcons[statusTone]

  return (
    <Card className="border-accent-500/35 bg-sg-800/90">
      <CardHeader
        title={title}
        subtitle={subtitle}
        action={action}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] ${statusClasses[statusTone]}`}>
          <StatusIcon size={14} />
          {statusLabel}
        </span>
        <span className="text-xs leading-relaxed text-text-dim">
          First-read summary for sales, operations, and engineering handoff.
        </span>
      </div>

      <dl className="grid grid-cols-1 border-y border-sg-600/45 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="border-b border-sg-600/35 py-3 pr-4 lg:border-b-0">
            <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-dim">{metric.label}</dt>
            <dd className="mt-1 text-base font-bold leading-tight text-text">{metric.value}</dd>
            {metric.detail && <dd className="mt-1 text-xs leading-relaxed text-text-muted">{metric.detail}</dd>}
          </div>
        ))}
      </dl>

      <div className="mt-5">
        <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-text-dim">
          <Route size={14} className="text-accent-500" />
          Operating Path
        </div>
        <ol className="grid grid-cols-1 gap-0 border-y border-sg-600/35 md:grid-cols-5">
          {steps.map((step, index) => (
            <li key={`${step.label}-${index}`} className="border-b border-sg-600/35 py-3 pr-4 md:border-b-0 md:border-r md:last:border-r-0">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent-500/45 bg-accent-500/10 text-xs font-bold text-accent-300">
                  {index + 1}
                </span>
                <span className="text-sm font-bold text-text">{step.label}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-text-muted">{step.detail}</p>
            </li>
          ))}
        </ol>
      </div>

      {notes.length > 0 && (
        <div className="mt-4 border-t border-sg-600/35 pt-3">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-text-dim">
            <ClipboardCheck size={14} className="text-accent-500" />
            Before Finalizing
          </div>
          <ul className="grid gap-2 text-xs leading-relaxed text-text-muted md:grid-cols-2">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
