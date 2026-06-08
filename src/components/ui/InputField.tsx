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
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-sm font-medium text-text-muted">
        {label}
        {unit && <span className="text-accent-400 font-normal">({unit})</span>}
        {required && <span className="text-error">*</span>}
        {tooltip && (
          <span className="relative group">
            <Info size={13} className="text-text-dim cursor-help" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-sg-900 text-xs text-text rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
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
        className={`w-full px-3 py-2 bg-sg-800 border rounded-lg text-text text-sm focus:outline-none focus:ring-2 transition-colors ${
          error
            ? 'border-error focus:ring-error/40'
            : warning
              ? 'border-warning focus:ring-warning/40'
              : 'border-sg-600 focus:ring-accent-500/40 focus:border-accent-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {error && (
        <p className="flex items-center gap-1 text-xs text-error">
          <AlertCircle size={12} /> {error}
        </p>
      )}
      {warning && !error && (
        <p className="flex items-center gap-1 text-xs text-warning">
          <AlertTriangle size={12} /> {warning}
        </p>
      )}
    </div>
  )
}
