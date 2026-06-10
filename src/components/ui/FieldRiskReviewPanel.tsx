import { AlertTriangle, ClipboardList, Gauge, HelpCircle } from 'lucide-react'
import { Card, CardHeader } from './Card'
import { ResultGrid, ResultItem } from './ResultDisplay'
import { SelectField } from './SelectField'
import { fmt, fmtPercent } from '../../lib/formatters'
import type { FieldRiskReview, RiskPosture, RvServicePosture, TempPowerRiskInputs } from '../../features/scenarios/fieldRiskReview'

interface FieldRiskReviewPanelProps {
  inputs: TempPowerRiskInputs
  review: FieldRiskReview
  onChange: <K extends keyof TempPowerRiskInputs>(field: K, value: TempPowerRiskInputs[K]) => void
}

const postureOptions: { value: RiskPosture; label: string }[] = [
  { value: 'known', label: 'Known' },
  { value: 'assume_typical', label: 'Assume typical' },
  { value: 'unknown', label: 'Unknown' },
]

const rvOptions: { value: RvServicePosture; label: string }[] = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'known_30a', label: 'Known - 30A' },
  { value: 'known_50a', label: 'Known - 50A' },
  { value: 'mixed', label: 'Mixed' },
]

function confidenceClass(band: FieldRiskReview['confidenceBand']) {
  if (band === 'high') return 'border-success/40 bg-success/10 text-success'
  if (band === 'medium') return 'border-warning/40 bg-warning/10 text-warning'
  return 'border-coral-500/40 bg-coral-500/10 text-coral-400'
}

function severityClass(severity: FieldRiskReview['items'][number]['severity']) {
  if (severity === 'critical') return 'border-coral-500/35 bg-coral-500/10'
  if (severity === 'review') return 'border-warning/35 bg-warning/10'
  return 'border-sg-600/40 bg-sg-900/45'
}

export function FieldRiskReviewPanel({ inputs, review, onChange }: FieldRiskReviewPanelProps) {
  const confidenceLabel = `${review.confidenceBand[0].toUpperCase()}${review.confidenceBand.slice(1)} confidence`

  return (
    <Card>
      <CardHeader
        title="Field Risk Review"
        subtitle="Unknowns and field-experience adders that keep the easy button honest"
        action={
          <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${confidenceClass(review.confidenceBand)}`}>
            <Gauge size={14} />
            {confidenceLabel}
          </div>
        }
      />

      <ResultGrid>
        <ResultItem label="Confidence Score" value={`${review.confidenceScore}/100`} highlight={review.confidenceBand === 'low'} />
        <ResultItem label="Adjusted Planning Load" value={fmt(review.adjustedPlanningKw, 1)} unit="kW" highlight />
        <ResultItem label="Risk-Adjusted Generator" value={fmt(review.adjustedGeneratorKva, 0)} unit="kVA" highlight beforeMargin={`${fmt(review.adjustedPlanningKw, 0)} kW adjusted load; ${fmt(review.adjustedGeneratorKw, 0)} kW at 1.25x`} />
        <ResultItem label="Field Risk Contingency" value={fmt(review.contingencyKw, 1)} unit="kW" beforeMargin={`${fmtPercent(review.loadContingencyPct)} load / ${fmtPercent(review.coolingContingencyPct)} cooling`} />
      </ResultGrid>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="RV Service"
          value={inputs.rvService}
          onChange={(value) => onChange('rvService', value as RvServicePosture)}
          options={rvOptions}
          tooltip="RV pedestal service is one of the biggest swing variables"
        />
        <SelectField
          label="Hidden Trailer Loads"
          value={inputs.hiddenPlugLoads}
          onChange={(value) => onChange('hiddenPlugLoads', value as RiskPosture)}
          options={postureOptions}
          tooltip="Microwaves, heaters, coffee, chargers, and surprise office loads"
        />
        <SelectField
          label="Motor / Compressor Starting"
          value={inputs.motorStarting}
          onChange={(value) => onChange('motorStarting', value as RiskPosture)}
          options={postureOptions}
          tooltip="Pump or compressor inrush can drive generator transient sizing"
        />
        <SelectField
          label="Occupancy Creep"
          value={inputs.occupancyVariance}
          onChange={(value) => onChange('occupancyVariance', value as RiskPosture)}
          options={postureOptions}
          tooltip="Actual headcount often exceeds the first planning number"
        />
        <SelectField
          label="Tent / Air Distribution"
          value={inputs.airDistribution}
          onChange={(value) => onChange('airDistribution', value as RiskPosture)}
          options={postureOptions}
          tooltip="Cooling fails when supply air is not distributed through the space"
        />
        <SelectField
          label="Winter Heat Creep"
          value={inputs.winterHeat}
          onChange={(value) => onChange('winterHeat', value as RiskPosture)}
          options={postureOptions}
          tooltip="Portable electric heat can appear after the quote"
        />
        <SelectField
          label="Shower / Water Heating"
          value={inputs.waterHeating}
          onChange={(value) => onChange('waterHeating', value as RiskPosture)}
          options={postureOptions}
          tooltip="Electric water heating can dominate morning and shift-change peaks"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-text-dim">
            <AlertTriangle size={14} />
            Risk Flags
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {review.items.map((item) => (
              <div key={item.id} className={`rounded-lg border p-3 ${severityClass(item.severity)}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-text">{item.label}</p>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim">{item.status}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">{item.impact}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-text-dim">
            <HelpCircle size={14} />
            RFIs
          </div>
          <div className="rounded-lg border border-sg-600/40 bg-sg-900/55 p-4">
            <ul className="space-y-2 text-xs leading-relaxed text-text-muted">
              {review.rfis.map((rfi) => (
                <li key={rfi} className="flex gap-2">
                  <ClipboardList size={13} className="mt-0.5 shrink-0 text-accent-400" />
                  <span>{rfi}</span>
                </li>
              ))}
            </ul>
            {review.rfis.length === 0 && (
              <p className="text-xs text-text-muted">No open RFIs from this review.</p>
            )}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-text-dim">
            These items do not block a proposal. They make assumptions visible and carry field-risk contingency into the report.
          </p>
        </div>
      </div>
    </Card>
  )
}
