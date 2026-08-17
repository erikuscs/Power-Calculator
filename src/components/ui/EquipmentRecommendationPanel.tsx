import { BatteryCharging, Fuel, Leaf, Ruler, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, CardHeader } from './Card'
import { fmt, fmtInt } from '../../lib/formatters'
import type { EquipmentRecommendation, EquipmentRecommendationOption } from '../../lib/equipmentRecommendations'

interface EquipmentRecommendationPanelProps {
  recommendation: EquipmentRecommendation
}

const toneClasses = {
  generator: 'border-coral-500/35 bg-coral-500/10',
  bess: 'border-signal-blue/35 bg-signal-blue/10',
  hybrid: 'border-accent-500/35 bg-accent-500/10',
}

export function EquipmentRecommendationPanel({ recommendation }: EquipmentRecommendationPanelProps) {
  return (
    <Card>
      <CardHeader title="Suggested Equipment Setup" subtitle="Planning alternatives; selected calculator units may differ from optimized rental-fleet suggestions" />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <RecommendationCard
          type="generator"
          option={recommendation.generator}
          preferred={recommendation.preferred === 'generator'}
        />
        <RecommendationCard
          type="bess"
          option={recommendation.bess}
          preferred={recommendation.preferred === 'bess'}
        />
        <RecommendationCard
          type="hybrid"
          option={recommendation.hybrid}
          preferred={recommendation.preferred === 'hybrid'}
        />
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

function RecommendationCard({
  type,
  option,
  preferred,
}: {
  type: 'generator' | 'bess' | 'hybrid'
  option: EquipmentRecommendationOption
  preferred: boolean
}) {
  const Icon = type === 'generator' ? Fuel : type === 'bess' ? BatteryCharging : Zap

  return (
    <div className={`rounded-lg border p-4 ${toneClasses[type]} ${preferred ? 'ring-1 ring-accent-500/60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-accent-400" />
          <h3 className="text-sm font-bold text-text">{option.label}</h3>
        </div>
        {preferred && (
          <span className="rounded-md bg-accent-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sg-900">
            Suggested
          </span>
        )}
        {!preferred && option.practicality === 'impractical' && (
          <span className="rounded-md border border-warning/40 bg-warning/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-warning">
            Impractical
          </span>
        )}
      </div>

      <p className="mt-3 text-sm font-semibold leading-relaxed text-text">{option.units}</p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
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
