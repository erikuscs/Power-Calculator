interface RadioGroupProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

export function RadioGroup({ label, value, onChange, options }: RadioGroupProps) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              value === opt.value
                ? 'bg-accent-500 text-sg-900'
                : 'bg-sg-900 text-text-muted border border-sg-600/50 hover:border-accent-500/40'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
