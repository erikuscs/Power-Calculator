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
    <div className="mt-5 bg-sg-900 border border-sg-600/30 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-5 py-3 text-xs font-semibold text-text-dim uppercase tracking-wider hover:bg-sg-800 transition-colors"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {title}
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="space-y-0.5 border-l-2 border-sg-600/40 pl-4">
              <div className="text-[10px] text-accent-400 font-bold uppercase tracking-wider">{step.label}</div>
              <div className="font-mono text-sm text-text-dim">{step.formula}</div>
              <div className="font-mono text-sm text-text-muted">= {step.substituted}</div>
              <div className="font-mono text-sm text-accent-300 font-bold">= {step.result}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
