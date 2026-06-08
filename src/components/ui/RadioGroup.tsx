interface RadioGroupProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

export function RadioGroup({ label, value, onChange, options }: RadioGroupProps) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              value === opt.value
                ? 'bg-accent-500 text-sg-900'
                : 'bg-sg-800 text-text-muted border border-sg-600 hover:border-accent-500/50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
