import { Info } from 'lucide-react'

interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  unit?: string
  required?: boolean
  tooltip?: string
}

export function SelectField({ label, value, onChange, options, unit, required, tooltip }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
        {label}
        {unit && <span className="text-accent-400 font-normal normal-case tracking-normal">({unit})</span>}
        {required && <span className="text-coral-500">*</span>}
        {tooltip && (
          <span className="relative group">
            <Info size={12} className="text-text-dim cursor-help" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-3 py-1.5 bg-sg-900 text-xs text-text rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-sg-600/40">
              {tooltip}
            </span>
          </span>
        )}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 bg-sg-900 border border-sg-600/50 rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
