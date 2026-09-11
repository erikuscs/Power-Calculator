import { ChevronDown, Info } from 'lucide-react'
import { useId } from 'react'

interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  unit?: string
  required?: boolean
  tooltip?: string
  placeholder?: string
}

export function SelectField({ label, value, onChange, options, unit, required, tooltip, placeholder }: SelectFieldProps) {
  const selectId = useId()

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
          {label}
          {unit && <span className="text-accent-400 font-normal normal-case tracking-normal">({unit})</span>}
          {required && <span className="text-coral-500">*</span>}
          {tooltip && (
            <span className="relative group">
              <Info size={12} className="text-text-dim cursor-help" />
              <span className="absolute bottom-full right-0 mb-1.5 w-56 max-w-[calc(100vw-2rem)] px-3 py-1.5 text-left text-xs font-normal normal-case tracking-normal text-text opacity-0 shadow-lg transition-opacity pointer-events-none z-10 rounded-lg border border-sg-600/40 bg-sg-900 whitespace-normal group-hover:opacity-100 group-focus-within:opacity-100 sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
                {tooltip}
              </span>
            </span>
          )}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          aria-label={label || placeholder || 'Select option'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-3.5 py-2.5 pr-9 bg-sg-900 border border-sg-600/50 rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-dim" />
      </div>
    </div>
  )
}
