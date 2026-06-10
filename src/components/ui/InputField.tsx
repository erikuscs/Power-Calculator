import { AlertCircle, AlertTriangle, Info } from 'lucide-react'

interface InputFieldProps {
  label: string
  unit?: string
  value: number | string
  onChange: (value: string) => void
  type?: 'number' | 'text' | 'date'
  placeholder?: string
  required?: boolean
  error?: string
  warning?: string
  tooltip?: string
  min?: number
  max?: number
  step?: number | string
  disabled?: boolean
}

export function InputField({
  label, unit, value, onChange, type = 'number',
  placeholder, required, error, warning, tooltip,
  min, max, step, disabled,
}: InputFieldProps) {
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
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={`w-full px-3.5 py-2.5 bg-sg-900 border rounded-lg text-text text-sm focus:outline-none focus:ring-2 transition-colors ${
          error
            ? 'border-coral-500 focus:ring-coral-500/40'
            : warning
              ? 'border-warning focus:ring-warning/40'
              : 'border-sg-600/50 focus:ring-accent-500/40 focus:border-accent-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-coral-500">
          <AlertCircle size={12} /> {error}
        </p>
      )}
      {warning && !error && (
        <p className="flex items-center gap-1.5 text-xs text-warning">
          <AlertTriangle size={12} /> {warning}
        </p>
      )}
    </div>
  )
}
