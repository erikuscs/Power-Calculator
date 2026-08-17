import { BatteryCharging, CheckCircle2, Fuel, Leaf, Ruler, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, CardHeader } from './Card'
import { fmt, fmtInt } from '../../lib/formatters'
import type { EquipmentRecommendation, EquipmentRecommendationOption } from '../../lib/equipmentRecommendations'

interface EquipmentRecommendationPanelProps {
  recommendation: EquipmentRecommendation
}

const toneClasses = {
  generator: 'border-coral-500/35 bg-coral-500/10 text-coral-400',
  bess: 'border-signal-blue/35 bg-signal-blue/10 text-signal-blue',
  hybrid: 'border-accent-500/35 bg-accent-500/10 text-accent-300',
}

const iconToneClasses = {
  generator: 'text-coral-400',
  bess: 'text-signal-blue',
  hybrid: 'text-accent-300',
}

export function EquipmentRecommendationPanel({ recommendation }: EquipmentRecommendationPanelProps) {
  const preferred = recommendation[recommendation.preferred]
  const alternates = ([
    ['generator', recommendation.generator],
    ['bess', recommendation.bess],
    ['hybrid', recommendation.hybrid],
  ] as const).filter(([type]) => type !== recommendation.preferred)

  return (
    <Card>
      <CardHeader title="Suggested Equipment Setup" subtitle="Recommended setup first, alternates below for review" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <PreferredSetup type={recommendation.preferred} option={preferred} />

        <div>
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-text-dim">Alternates</h3>
          <div className="divide-y divide-sg-600/35 border-y border-sg-600/35">
            {alternates.map(([type, option]) => (
              <ComparisonRow key={type} type={type} option={option} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.4fr]">
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          recommendation.fuelCell.fit === 'strong'
            ? 'border-success/35 bg-success/10 text-success'
            : recommendation.fuelCell.fit === 'possible'
              ? 'border-warning/35 bg-warning/10 text-warning'
              : 'border-sg-600/40 bg-sg-900/60 text-text-muted'
        }`}>
          <div className="flex items-center gap-2 font-semibold">
            <Leaf size={15} />
            {recommendation.fuelCell.label}
          </div>
          <p className="mt-1 leading-relaxed">{recommendation.fuelCell.reason}</p>
        </div>
        <div className="rounded-lg border border-sg-600/40 bg-sg-900/60 px-4 py-3 text-xs leading-relaxed text-text-dim">
          {recommendation.sourceNote}
        </div>
      </div>
    </Card>
  )
}

function PreferredSetup({
  type,
  option,
}: {
  type: 'generator' | 'bess' | 'hybrid'
  option: EquipmentRecommendationOption
}) {
  const Icon = type === 'generator' ? Fuel : type === 'bess' ? BatteryCharging : Zap

  return (
    <div className={`rounded-lg border p-4 ${toneClasses[type]}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Icon size={18} />
            <h3 className="text-sm font-bold text-text">{option.label}</h3>
          </div>
          <p className="mt-3 text-xl font-bold leading-tight text-text">{option.units}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-accent-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sg-900">
          <CheckCircle2 size={12} />
          Suggested
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
        <Metric label="Power" value={`${fmtInt(option.capacityKw)} kW`} />
        <Metric label="Footprint" value={`~${fmtInt(option.footprintSqFt)} sq ft`} icon={<Ruler size={12} />} />
        {option.energyKwh !== undefined && <Metric label="Energy" value={`${fmt(option.energyKwh, 0)} kWh`} />}
      </div>

      <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-text-muted">
        {option.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  )
}

function ComparisonRow({
  type,
  option,
}: {
  type: 'generator' | 'bess' | 'hybrid'
  option: EquipmentRecommendationOption
}) {
  const Icon = type === 'generator' ? Fuel : type === 'bess' ? BatteryCharging : Zap

  return (
    <div className="py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon size={15} className={iconToneClasses[type]} />
            <h3 className="text-sm font-bold text-text">{option.label}</h3>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-text-muted">{option.units}</p>
        </div>
        <div className="text-right text-xs text-text-muted">
          <div className="font-bold text-text">{fmtInt(option.capacityKw)} kW</div>
          <div>~{fmtInt(option.footprintSqFt)} sq ft</div>
        </div>
      </div>
      {option.practicality === 'impractical' && (
        <div className="mt-2 text-xs font-semibold text-warning">Usually impractical at this load or duration</div>
      )}
    </div>
  )
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-lg border border-sg-600/35 bg-sg-900/55 px-3 py-2">
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-text-dim">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-bold text-text">{value}</div>
    </div>
  )
}
