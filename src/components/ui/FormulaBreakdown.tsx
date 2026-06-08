import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface FormulaStep {
  label: string
  formula: string
  substituted: string
  result: string
}

export function FormulaBreakdown({ steps, title = 'Formula Used' }: { steps: FormulaStep[]; title?: string }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="mt-4 bg-sg-800 border border-sg-600 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-muted hover:bg-sg-700 transition-colors"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {title}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="space-y-0.5">
              <div className="text-xs text-accent-400 font-medium">{step.label}</div>
              <div className="font-mono text-sm text-text-muted">{step.formula}</div>
              <div className="font-mono text-sm text-text-muted">= {step.substituted}</div>
              <div className="font-mono text-sm text-accent-300 font-semibold">= {step.result}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
