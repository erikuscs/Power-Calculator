import { useMemo, useState, type ReactNode } from 'react'
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Fan,
  FileCheck2,
  Gauge,
  Info,
  Map as MapIcon,
  MonitorCog,
  Ruler,
  ShieldAlert,
  SlidersHorizontal,
  Zap,
} from 'lucide-react'
import { PdfActionBar } from '../../components/pdf/PdfActionBar'
import { SelectField } from '../../components/ui/SelectField'
import { PrintableOneLine } from '../../components/ui/OneLineDiagramPanel'
import type { EquipmentRecommendation } from '../../lib/equipmentRecommendations'
import { fmt, fmtInt, fmtPercent } from '../../lib/formatters'
import generatorSiteLayout3d from '../../assets/emaas-generator-site-layout-3d.jpg'
import generatorCoolingSiteLayout3d from '../../assets/emaas-generator-cooling-site-layout-3d.jpg'
import type { FieldRiskReview, RiskPosture, RvServicePosture, TempPowerRiskInputs } from './fieldRiskReview'
import type { OneLineDiagram } from './oneLineDiagram'
import type { TempPowerInputs, TempPowerResults } from './scenario.formulas'
import { TempPowerPdfDoc } from './TempPowerPdf'
import {
  buildTempPowerPlainLanguageReason,
  compactEquipmentLabel,
  panelSizingExplanation,
  rentalPeriodLabel,
  runtimeScheduleLabel,
  sizingTradeoffs,
} from './tempPowerPresentation'

interface TempPowerReviewPlanProps {
  inputs: TempPowerInputs
  results: TempPowerResults
  recommendation: EquipmentRecommendation
  fieldRiskReview: FieldRiskReview
  riskInputs: TempPowerRiskInputs
  onRiskChange: (field: keyof TempPowerRiskInputs, value: RiskPosture | RvServicePosture) => void
  oneLineDiagram: OneLineDiagram
  clientName: string
  projectName: string
  onEditRequirements?: () => void
}

type VisualMode = 'one-line' | 'layout'

const postureOptions: { value: RiskPosture; label: string }[] = [
  { value: 'known', label: 'Confirmed / no added risk' },
  { value: 'assume_typical', label: 'Use typical allowance' },
  { value: 'unknown', label: 'Unknown / add contingency' },
]

const rvOptions: { value: RvServicePosture; label: string }[] = [
  { value: 'unknown', label: 'Unknown / add contingency' },
  { value: 'known_30a', label: 'Confirmed 30A pedestals' },
  { value: 'known_50a', label: 'Confirmed 50A pedestals' },
  { value: 'mixed', label: 'Mixed 30A / 50A service' },
]

const riskControlLabels: Record<keyof TempPowerRiskInputs, string> = {
  rvService: 'RV Service',
  hiddenPlugLoads: 'Hidden Trailer Loads',
  motorStarting: 'Motor / Compressor Starting',
  occupancyVariance: 'Occupancy Creep',
  airDistribution: 'Tent / Air Distribution',
  winterHeat: 'Winter Heat Creep',
  waterHeating: 'Shower / Water Heating',
}

function reportFilename(projectName: string) {
  const slug = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `emaas-${slug || 'temp-power'}-review-package.pdf`
}

function confidenceClasses(band: FieldRiskReview['confidenceBand']) {
  if (band === 'high') return 'border-success/35 bg-success/10 text-success'
  if (band === 'medium') return 'border-warning/35 bg-warning/10 text-warning'
  return 'border-warning/35 bg-warning/10 text-warning'
}

function DetailDisclosure({ title, summary, children }: { title: string; summary: string; children: ReactNode }) {
  return (
    <details className="group rounded-xl border border-sg-600/45 bg-sg-800/70">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-400/70">
        <span>
          <span className="block text-sm font-bold text-text">{title}</span>
          <span className="mt-1 block text-xs leading-relaxed text-text-muted">{summary}</span>
        </span>
        <ChevronDown size={18} className="shrink-0 text-text-dim transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-sg-600/35 px-5 py-5">{children}</div>
    </details>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Zap; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sg-500 bg-sg-900 text-steel-400">
        <Icon size={16} />
      </span>
      <div>
        <div className="text-sm font-bold leading-tight text-text">{value}</div>
        <div className="mt-0.5 text-xs text-text-muted">{label}</div>
      </div>
    </div>
  )
}

export function TempPowerReviewPlan({
  inputs,
  results,
  recommendation,
  fieldRiskReview,
  riskInputs,
  onRiskChange,
  oneLineDiagram,
  clientName,
  projectName,
  onEditRequirements,
}: TempPowerReviewPlanProps) {
  const [visualMode, setVisualMode] = useState<VisualMode>('one-line')
  const preferred = recommendation.generator
  const includeCooling = inputs.includeCooling !== false
  const reason = buildTempPowerPlainLanguageReason(recommendation, includeCooling)
  const openChecks = fieldRiskReview.rfis.length
  const confidenceLabel = `${fieldRiskReview.confidenceBand[0].toUpperCase()}${fieldRiskReview.confidenceBand.slice(1)} confidence`
  const filename = reportFilename(projectName)
  const siteVoltage = inputs.siteVoltage ?? 480
  const cableLegs = Math.max(1, Math.ceil(results.ampsPerPhase / 400))
  const rentalTerm = rentalPeriodLabel(inputs.rentalPeriod ?? 'daily', inputs.rentalPeriodCount ?? Math.max(1, results.rentalDays))
  const scheduleLabel = runtimeScheduleLabel(inputs.runtimeSchedule)
  const siteLayout3d = includeCooling ? generatorCoolingSiteLayout3d : generatorSiteLayout3d

  const riskItems = useMemo(
    () => new Map(fieldRiskReview.items.map((item) => [item.id, item])),
    [fieldRiskReview.items],
  )

  const riskControls = (Object.keys(riskControlLabels) as (keyof TempPowerRiskInputs)[])
    .filter((key) => includeCooling || key !== 'airDistribution')
    .map((key) => ({
      key,
      label: riskControlLabels[key],
      value: riskInputs[key],
      options: key === 'rvService' ? rvOptions : postureOptions,
      item: riskItems.get(key),
    }))

  const energyPriorities = [
    {
      icon: SlidersHorizontal,
      title: 'Load right-sizing',
      detail: 'Match the generator to expected demand and starting loads instead of the breaker-panel rating.',
      signal: `${fmtPercent(results.loadFactor)} planned load factor`,
    },
    {
      icon: Clock3,
      title: 'Runtime and service',
      detail: 'Fuel and maintenance are calculated from the rental term and selected operating schedule.',
      signal: `${fmtInt(results.operatingHours)} operating hours`,
    },
    ...(includeCooling
      ? [{
          icon: Fan,
          title: 'Cooling add-on',
          detail: 'Cooling is a separate downstream load and appears only because it was selected.',
          signal: `${fmt(results.coolingTons, 1)} tons planned`,
        }]
      : []),
    {
      icon: MonitorCog,
      title: 'Monitoring and controls',
      detail: 'Track kW, fuel, power factor, temperature, alarms, and service cadence.',
      signal: 'Remote monitoring ready',
    },
  ]

  return (
    <section aria-labelledby="recommended-energy-plan" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="text-xs text-text-muted">
          <span className="font-semibold text-accent-400">Temporary Power</span>
          <span className="px-2 text-text-dim">/</span>
          Recommended Energy Plan
        </div>
        {onEditRequirements ? (
          <button
            type="button"
            aria-label="Requirements selected - edit requirements"
            onClick={onEditRequirements}
            className="inline-flex items-center gap-2 rounded-lg border border-sg-600/50 bg-sg-800/65 px-3 py-2 text-xs font-semibold text-success transition-colors hover:border-accent-500/50 hover:text-accent-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70"
          >
            <CheckCircle2 size={16} />
            Requirements selected
            <span className="border-l border-sg-600/50 pl-2 text-text-muted">Edit</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-success">
            <CheckCircle2 size={16} />
            Requirements selected
          </div>
        )}
      </div>

      <h1 id="recommended-energy-plan" className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
        Recommended Energy Plan
      </h1>

      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${confidenceClasses(fieldRiskReview.confidenceBand)}`}>
        <div className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em]">
          <ShieldAlert size={18} />
          {confidenceLabel} - {fieldRiskReview.confidenceScore}/100
        </div>
        <p className="max-w-md text-xs leading-relaxed text-text-muted">
          {openChecks > 0
            ? `${openChecks} field check${openChecks === 1 ? '' : 's'} remain open. They affect contingency and final package confirmation.`
            : 'The core field assumptions are confirmed. Final engineering checks still apply.'}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-sg-600/50 bg-sg-800/85 shadow-2xl shadow-black/20">
        <div className="grid grid-cols-1 xl:grid-cols-[0.78fr_1.22fr]">
          <div className="border-b border-sg-600/45 p-4 xl:border-b-0 xl:border-r">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-dim">Recommended Package</div>
            <h2 className="mt-2 text-xl font-bold leading-tight text-text">{compactEquipmentLabel(preferred.units)}</h2>
            <p className="mt-1 text-sm text-text-muted">
              Standalone generator{includeCooling ? ' + temporary cooling add-on' : ' • power-only scope'}
            </p>

            <div className="mt-3 rounded-lg border border-accent-500/35 bg-accent-500/8 p-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-accent-300">
                <Info size={15} />
                Why this fits
              </div>
              <p className="mt-2 text-xs leading-relaxed text-text">{reason}</p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
              <Metric icon={Activity} label="Planning Load" value={`${fmt(fieldRiskReview.adjustedPlanningKw, 1)} kW`} />
              <Metric icon={Zap} label="Distribution" value={`${siteVoltage} V`} />
              <Metric icon={Gauge} label="Generator" value={`${fmt(results.generatorKva, 0)} kVA`} />
              <Metric icon={Ruler} label="Planning Footprint" value={`~${fmtInt(preferred.footprintSqFt)} sq ft`} />
              <Metric icon={Clock3} label="Rental Term" value={rentalTerm} />
              <Metric icon={Clock3} label={scheduleLabel} value={`${fmtInt(results.operatingHours)} hr`} />
              {includeCooling && <Metric icon={Fan} label="Cooling Add-on" value={`${fmt(results.coolingTons, 1)} tons`} />}
            </div>

            <div className="mt-4 border-t border-sg-600/40 pt-3">
              <PdfActionBar
                document={(
                  <TempPowerPdfDoc
                    inputs={inputs}
                    results={results}
                    riskReview={fieldRiskReview}
                    clientName={clientName}
                    projectName={projectName}
                  />
                )}
                filename={filename}
                title="EMaaS Recommended Energy Plan"
                shareText={`${clientName || 'Client'} - ${projectName || 'Temporary Power Review'} recommended energy plan`}
              />
            </div>
          </div>

          <div className="min-w-0 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-dim">Solution Visualization</div>
                <div className="mt-1 text-xs text-text-muted">Both views show only the equipment included in this scope.</div>
              </div>
              <div className="inline-flex rounded-lg border border-sg-600/60 bg-sg-900 p-1" role="tablist" aria-label="Solution visualization">
                <button
                  type="button"
                  role="tab"
                  aria-selected={visualMode === 'one-line'}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${visualMode === 'one-line' ? 'bg-accent-500 text-sg-900' : 'text-text-muted hover:text-text'}`}
                  onClick={() => setVisualMode('one-line')}
                >
                  One-Line
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={visualMode === 'layout'}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${visualMode === 'layout' ? 'bg-accent-500 text-sg-900' : 'text-text-muted hover:text-text'}`}
                  onClick={() => setVisualMode('layout')}
                >
                  3D Site Layout
                </button>
              </div>
            </div>

            <div role="tabpanel" className="min-h-[310px] overflow-hidden rounded-lg border border-sg-600/45 bg-sg-900/75">
              {visualMode === 'one-line' ? (
                <PrintableOneLine diagram={oneLineDiagram} compact showNotes={false} />
              ) : (
                <figure>
                  <img
                    src={siteLayout3d}
                    alt={includeCooling
                      ? 'Isometric 3D planning mockup showing a standalone generator, controls, switchgear, transformer, distribution panels, and temporary cooling'
                      : 'Isometric 3D planning mockup showing a standalone generator, controls, switchgear, transformer, and distribution panels'}
                    className="h-[286px] w-full object-cover object-center sm:h-[320px]"
                  />
                  <figcaption className="border-t border-sg-600/35 px-4 py-3 text-xs leading-relaxed text-text-muted">
                    {includeCooling ? 'Generator-led power with the selected cooling add-on.' : 'Generator-only power scope; cooling and battery equipment are not included.'} Final clearances, access, cable paths, grounding, containment, and fire protection require site verification.
                  </figcaption>
                </figure>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-sg-600/45 px-5 py-3 text-xs text-text-muted">
          <span className="font-bold uppercase tracking-[0.14em] text-text-dim">Selected Scope:</span>{' '}
          Standalone generator{includeCooling ? ' with temporary cooling.' : '. Cooling is not included.'}
          {' '}Battery or hybrid operation is evaluated in the Hybrid EMaaS Strategy workflow.
        </div>
      </div>

      <div>
        <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-text-dim">Energy Management Priorities</div>
        <div className="overflow-hidden rounded-xl border border-sg-600/45 bg-sg-800/70">
          {energyPriorities.map((priority, index) => (
            <div key={priority.title} className="grid gap-3 border-b border-sg-600/35 px-4 py-3 last:border-b-0 md:grid-cols-[28px_190px_1fr_auto] md:items-center">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-accent-500/70 text-xs font-bold text-accent-300">{index + 1}</span>
              <div className="flex items-center gap-2 text-sm font-bold text-text">
                <priority.icon size={16} className="text-steel-400" />
                {priority.title}
              </div>
              <div className="text-xs leading-relaxed text-text-muted">{priority.detail}</div>
              <div className="text-xs font-semibold text-accent-400">{priority.signal}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <DetailDisclosure title="Calculation Details" summary="Grouped load, source, distribution, fuel, runtime, and service values.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <CalculationGroup
              title={includeCooling ? 'Load and Cooling' : 'Load'}
              rows={[
                ['Equipment load', `${fmt(results.totalLoadKw, 1)} kW`],
                ...(includeCooling ? [['Cooling add-on', `${fmt(results.coolingKw, 1)} kW`] as [string, string]] : []),
                ['Calculated operating load', `${fmt(results.totalWithCoolingKw, 1)} kW`],
                ['Risk-adjusted load', `${fmt(fieldRiskReview.adjustedPlanningKw, 1)} kW`],
              ]}
            />
            <CalculationGroup
              title="Source and Distribution"
              rows={[
                ['Generator', `${fmt(results.generatorKw, 0)} kW / ${fmt(results.generatorKva, 0)} kVA`],
                ['Load factor', fmtPercent(results.loadFactor)],
                ['Current', `${fmt(results.ampsPerPhase, 0)} A/phase`],
                ['Cable planning', `${cableLegs} leg${cableLegs === 1 ? '' : 's'}/phase`],
              ]}
            />
            <CalculationGroup
              title="Fuel and Runtime"
              rows={[
                ['Fuel rate', `${fmt(results.fuelGallonsPerHour, 1)} gal/hr`],
                ['Total fuel', `${fmtInt(results.totalFuelGallons)} gal`],
                ['Operating time', `${fmtInt(results.operatingHours)} hr`],
                ['Rental duration', `${fmt(results.rentalDays, 0)} days`],
                ['Schedule', scheduleLabel],
              ]}
            />
            <CalculationGroup
              title="Service and Risk"
              rows={[
                ['PM events', fmtInt(results.serviceEvents)],
                ['Contingency', `${fmt(fieldRiskReview.contingencyKw, 1)} kW`],
                ['Open field checks', `${openChecks}`],
                ['Noise fine exposure', `$${fmtInt(results.noiseFineExposure)}`],
              ]}
            />
          </div>
        </DetailDisclosure>

        <DetailDisclosure title="Field Verification" summary={`${openChecks} open question${openChecks === 1 ? '' : 's'}; selections update contingency and confidence immediately.`}>
          <div className="grid gap-4 lg:grid-cols-2">
            {riskControls.map((control) => (
              <div key={control.key} className="rounded-lg border border-sg-600/40 bg-sg-900/55 p-4">
                <SelectField
                  label={control.label}
                  value={control.value}
                  onChange={(value) => onRiskChange(control.key, value as RiskPosture | RvServicePosture)}
                  options={control.options}
                />
                {control.item && <p className="mt-2 text-xs leading-relaxed text-text-muted">{control.item.impact}</p>}
              </div>
            ))}
          </div>
        </DetailDisclosure>

        <DetailDisclosure title="Why Not Size to the Breaker Panel?" summary="The panel rating is a distribution limit, not the expected operating demand.">
          <p className="max-w-4xl text-sm leading-relaxed text-text">{panelSizingExplanation}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-warning/35 bg-warning/10 p-4 text-sm leading-relaxed text-text-muted">
              <strong className="text-warning">Oversizing:</strong> {sizingTradeoffs.oversized}
            </div>
            <div className="rounded-lg border border-coral-500/35 bg-coral-500/10 p-4 text-sm leading-relaxed text-text-muted">
              <strong className="text-coral-400">Undersizing:</strong> {sizingTradeoffs.undersized}
            </div>
          </div>
        </DetailDisclosure>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-sg-600/40 px-3 py-3 text-[11px] text-text-muted">
        <span className="inline-flex items-center gap-2 font-bold uppercase tracking-[0.15em] text-text-dim"><FileCheck2 size={15} /> Before Release</span>
        <span>Verify voltage drop</span>
        <span>Confirm OCPD ratings</span>
        <span>Check grounding and bonding</span>
        <span>Size conductors</span>
        <span>Calculate fault current</span>
        <span>Confirm selective coordination</span>
      </div>

      <div className="flex items-start gap-2 px-1 text-xs leading-relaxed text-text-dim">
        <MapIcon size={14} className="mt-0.5 shrink-0" />
        Planning estimate only. Final equipment selection, conductor sizing, protection, grounding, placement, and code compliance require licensed engineering review.
      </div>
    </section>
  )
}

function CalculationGroup({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-lg border border-sg-600/40 bg-sg-900/55 p-4">
      <h3 className="text-xs font-bold uppercase tracking-[0.13em] text-accent-400">{title}</h3>
      <dl className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-3 text-xs">
            <dt className="text-text-muted">{label}</dt>
            <dd className="text-right font-semibold text-text">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
