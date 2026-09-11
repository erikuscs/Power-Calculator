import { useMemo, type ReactNode } from 'react'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileCheck2,
  Info,
  Map as MapIcon,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'
import { PdfActionBar } from '../../components/pdf/PdfActionBar'
import { SelectField } from '../../components/ui/SelectField'
import { fmt, fmtInt } from '../../lib/formatters'
import type { FieldVerificationReview, RiskPosture, RvServicePosture, TempPowerRiskInputs } from './fieldRiskReview'
import type { TempPowerPlanningInputs, TempPowerPlanningResults } from './scenario.formulas'
import {
  panelSizingExplanation,
  rentalPeriodLabel,
  runtimeScheduleLabel,
  sizingTradeoffs,
} from './tempPowerPresentation'
import type { TempPowerCalculationVerification } from './tempPowerVerification'

interface TempPowerReviewPlanProps {
  inputs: TempPowerPlanningInputs
  results: TempPowerPlanningResults
  calculationVerification: TempPowerCalculationVerification
  fieldRiskReview: FieldVerificationReview
  riskInputs: TempPowerRiskInputs
  onRiskChange: (field: keyof TempPowerRiskInputs, value: RiskPosture | RvServicePosture) => void
  clientName: string
  projectName: string
  onEditRequirements?: () => void
  isWorkedExample?: boolean
  onUseAsStartingPoint?: () => void
  onAddToEstimate?: () => void
}

const postureOptions: { value: RiskPosture; label: string }[] = [
  { value: 'known', label: 'Confirmed / no added risk' },
  { value: 'assume_typical', label: 'Use typical allowance' },
  { value: 'unknown', label: 'Unknown / needs confirmation' },
]

const rvOptions: { value: RvServicePosture; label: string }[] = [
  { value: 'unknown', label: 'Unknown / needs confirmation' },
  { value: 'known_30a', label: 'Confirmed 30A pedestals' },
  { value: 'known_50a', label: 'Confirmed 50A pedestals' },
  { value: 'mixed', label: 'Mixed 30A / 50A service' },
]

const riskControlLabels: Record<keyof TempPowerRiskInputs, string> = {
  rvService: 'RV Service',
  hiddenPlugLoads: 'Hidden Trailer Loads',
  motorStarting: 'Motor / Compressor Starting',
  occupancyVariance: 'Occupancy Changes',
  airDistribution: 'Tent / Air Distribution',
  winterHeat: 'Winter Heat',
  waterHeating: 'Shower / Water Heating',
}

function reportFilename(projectName: string) {
  const slug = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const base = slug || 'temp-power'
  const suffix = base.endsWith('planning-brief') ? 'draft' : 'planning-brief-draft'
  return `emaas-${base}-${suffix}.pdf`
}

function DetailDisclosure({ id, title, summary, children }: { id?: string; title: string; summary: string; children: ReactNode }) {
  return (
    <details id={id} className="group scroll-mt-24 rounded-xl border border-sg-600/45 bg-sg-800/70">
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

export function TempPowerReviewPlan({
  inputs,
  results,
  calculationVerification,
  fieldRiskReview,
  riskInputs,
  onRiskChange,
  clientName,
  projectName,
  onEditRequirements,
  isWorkedExample = false,
  onUseAsStartingPoint,
  onAddToEstimate,
}: TempPowerReviewPlanProps) {
  const includeCooling = inputs.includeCooling !== false
  const openChecks = fieldRiskReview.rfis.length
  const filename = reportFilename(projectName)
  const siteVoltage = inputs.siteVoltage ?? 480
  const loadVoltage = inputs.loadVoltage ?? siteVoltage
  const rentalTerm = rentalPeriodLabel(inputs.rentalPeriod ?? 'daily', inputs.rentalPeriodCount ?? Math.max(1, results.rentalDays))
  const scheduleLabel = runtimeScheduleLabel(inputs.runtimeSchedule)
  const includesRv = inputs.facilities.some((facility) => facility.type === 'rv')
  const continuityIntent = inputs.continuityTarget === 'n_plus_1'
    ? 'Generator redundancy'
    : 'Support the entered load'
  const voltageIntent = siteVoltage === loadVoltage
    ? `${loadVoltage} V source / ${loadVoltage} V load`
    : `${siteVoltage} V source / ${loadVoltage} V load`

  const riskItems = useMemo(
    () => new Map(fieldRiskReview.items.map((item) => [item.id, item])),
    [fieldRiskReview.items],
  )

  const riskControls = (Object.keys(riskControlLabels) as (keyof TempPowerRiskInputs)[])
    .filter((key) => key !== 'airDistribution' && (includesRv || key !== 'rvService'))
    .map((key) => ({
      key,
      label: riskControlLabels[key],
      value: riskInputs[key],
      options: key === 'rvService' ? rvOptions : postureOptions,
      item: riskItems.get(key),
    }))

  const conversationSteps = [
    {
      icon: Building2,
      label: 'Demand',
      value: `${fmt(results.totalWithCoolingKw, 1)} kW entered`,
      detail: includeCooling
        ? `Includes ${fmt(results.coolingKw, 1)} kW of cooling-equipment demand.`
        : 'Based on the equipment and facilities entered.',
    },
    {
      icon: SlidersHorizontal,
      label: 'Voltage',
      value: voltageIntent,
      detail: 'Verify available source voltage, phase, and load connection before equipment selection.',
    },
    {
      icon: ShieldCheck,
      label: 'Continuity',
      value: continuityIntent,
      detail: continuityIntent === 'Generator redundancy'
        ? 'A spare generator does not protect the controls and distribution between the source and the load.'
        : 'No spare source has been assumed.',
    },
    {
      icon: Clock3,
      label: 'Runtime',
      value: `${fmtInt(results.operatingHours)} scheduled hours`,
      detail: `${rentalTerm}; ${scheduleLabel.toLowerCase()}. Actual runtime depends on operations.`,
    },
    {
      icon: FileCheck2,
      label: 'Next decision',
      value: openChecks > 0 ? `${openChecks} checks remain` : 'Initial checks answered',
      detail: 'Confirm the open items before selecting equipment.',
    },
  ]

  const showFieldVerification = () => {
    const verification = document.getElementById('temp-power-field-verification') as HTMLDetailsElement | null
    if (!verification) return
    verification.open = true
    verification.scrollIntoView({ behavior: 'smooth', block: 'start' })
    verification.querySelector('summary')?.focus()
  }

  return (
    <section aria-labelledby="temp-power-planning-brief" className="space-y-3">
      {isWorkedExample && (
        <div className="flex flex-col gap-4 rounded-xl border border-accent-500/45 bg-accent-500/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-accent-300">Worked Example</div>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-text">
              This 56 kW jobsite example demonstrates the planning conversation. The values are examples, and no equipment package has been selected.
            </p>
          </div>
          {onUseAsStartingPoint && (
            <button
              type="button"
              onClick={onUseAsStartingPoint}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-bold text-sg-900 transition-colors hover:bg-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300"
            >
              Use as My Starting Point
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="text-xs text-text-muted">
          <span className="font-semibold text-accent-400">Temporary Power</span>
          <span className="px-2 text-text-dim">/</span>
          Planning Brief
        </div>
        {onEditRequirements && (
          <button
            type="button"
            aria-label={isWorkedExample ? 'Review worked example inputs' : 'Review temporary power inputs'}
            onClick={onEditRequirements}
            className="inline-flex items-center gap-2 rounded-lg border border-sg-600/50 bg-sg-800/65 px-3 py-2 text-xs font-semibold text-text transition-colors hover:border-accent-500/50 hover:text-accent-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70"
          >
            <CheckCircle2 size={16} className="text-success" />
            Review inputs
          </button>
        )}
      </div>

      <h1 id="temp-power-planning-brief" className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
        Temporary Power Planning Brief
      </h1>

      <div className="rounded-xl border border-signal-blue/40 bg-signal-blue/10 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-bold text-signal-blue">
              <Info size={18} />
              Planning brief ready for review
            </div>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-text-muted">
              This brief organizes the stated demand and operating needs. It does not select equipment or confirm outage coverage.
            </p>
          </div>
          {openChecks > 0 ? (
            <button
              type="button"
              onClick={showFieldVerification}
              className="rounded-md border border-signal-blue/35 px-3 py-2 text-xs font-semibold text-signal-blue transition-colors hover:bg-signal-blue/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue/60"
            >
              Review {openChecks} open item{openChecks === 1 ? '' : 's'}
            </button>
          ) : (
            <div className="text-xs font-semibold text-text">Initial field answers captured</div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-success/40 bg-success/10 px-4 py-3">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
          <div>
            <div className="text-sm font-bold text-text">Calculation check passed</div>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              {calculationVerification.passedCount} of {calculationVerification.checkedCount} arithmetic checks agree across line items, cooling scope, total load, rental days, and scheduled hours.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-text-dim">
              This confirms internal arithmetic only. Equipment selection and technical suitability still require project-specific verification.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-sg-600/50 bg-sg-800/85 shadow-2xl shadow-black/20">
        <div>
          <div className="p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-dim">What the inputs support</div>
            <h2 className="mt-2 text-xl font-bold leading-tight text-text">A clear starting point for the customer conversation</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Demand, runtime, voltage, and continuity needs are visible. The power-source setup, equipment quantity, protection, cabling, and placement still need project-specific review.
            </p>
          </div>

          <div className="min-w-0 border-t border-sg-600/45 p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-dim">Planning Path</div>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              Each step narrows the next decision without pretending the equipment package is final.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              {conversationSteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={step.label} className="flex flex-col rounded-lg border border-sg-600/45 bg-sg-900/55 p-3 lg:min-h-[168px]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-accent-400">
                        <Icon size={15} />
                        {step.label}
                      </div>
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-sg-600 text-[10px] font-bold text-text-dim">{index + 1}</span>
                    </div>
                    <div className="mt-3 text-sm font-bold leading-snug text-text">{step.value}</div>
                    <p className="mt-2 text-xs leading-relaxed text-text-muted">{step.detail}</p>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 rounded-lg border border-warning/35 bg-warning/10 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.13em] text-warning">Equipment comes after verification</div>
              <p className="mt-2 text-xs leading-relaxed text-text-muted">
                Final equipment decisions depend on verified starting loads, voltage and phase, cable distance, source controls, protection, site access, and what must remain running during an outage.
              </p>
            </div>

            <div className="mt-4 border-t border-sg-600/40 pt-4">
              {onAddToEstimate && !isWorkedExample && (
                <button
                  type="button"
                  onClick={onAddToEstimate}
                  className="mb-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-accent-500/45 bg-accent-500/10 px-4 py-2 text-sm font-bold text-accent-300 transition-colors hover:bg-accent-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70"
                >
                  Add to Estimate
                  <ArrowRight size={16} />
                </button>
              )}
              <PdfActionBar
                draft
                createDocument={async () => {
                  const { TempPowerPdfDoc } = await import('./TempPowerPdf')
                  return (
                    <TempPowerPdfDoc
                      inputs={inputs}
                      results={results}
                      riskReview={fieldRiskReview}
                      clientName={clientName}
                      projectName={projectName}
                      isWorkedExample={isWorkedExample}
                    />
                  )
                }}
                filename={filename}
                title="EMaaS Temporary Power Planning Brief - Draft"
                shareText={`${clientName || 'Client'} - ${projectName || 'Temporary Power'} planning brief draft`}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-sg-600/45 px-5 py-3 text-xs text-text-muted">
          <span className="font-bold uppercase tracking-[0.14em] text-text-dim">Planning Scope:</span>{' '}
          Temporary power demand{includeCooling ? ', entered cooling-equipment demand,' : ''}, operating schedule, voltage need, continuity intent, and open field checks.
        </div>
      </div>

      <div className="space-y-3">
        <DetailDisclosure
          id="temp-power-field-verification"
          title="Field Verification"
          summary={`${openChecks} open question${openChecks === 1 ? '' : 's'}; answers clarify the need and prepare the next review.`}
        >
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

        <DetailDisclosure title="Planning Details" summary="The load, schedule, voltage, and continuity information used in this draft.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <CalculationGroup
              title="Demand"
              rows={[
                ['Connected equipment', `${fmt(results.totalLoadKw, 1)} kW`],
                ...(includeCooling ? [['Cooling equipment', `${fmt(results.coolingKw, 1)} kW`] as [string, string]] : []),
                ['Entered operating demand', `${fmt(results.totalWithCoolingKw, 1)} kW`],
                ['Field allowance', 'Pending field verification'],
              ]}
            />
            <CalculationGroup
              title="Operating Basis"
              rows={[
                ['Rental term', rentalTerm],
                ['Schedule', scheduleLabel],
                ['Scheduled coverage', `${fmtInt(results.operatingHours)} hr`],
                ['Actual runtime', 'Confirm with the operating team'],
              ]}
            />
            <CalculationGroup
              title="Electrical Intent"
              rows={[
                ['Source / load voltage', `${siteVoltage} V / ${loadVoltage} V`],
                ['Continuity request', continuityIntent],
                ['Equipment package', 'Pending verification'],
                ['Open checks', `${openChecks}`],
              ]}
            />
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
        <span className="inline-flex items-center gap-2 font-bold uppercase tracking-[0.15em] text-text-dim"><FileCheck2 size={15} /> Before Equipment Selection</span>
        <span>Confirm starting loads</span>
        <span>Verify voltage and phase</span>
        <span>Define continuity expectation</span>
        <span>Confirm cable distance</span>
        <span>Review fault current and protection</span>
        <span>Verify site access and placement</span>
      </div>

      <div className="flex items-start gap-2 px-1 text-xs leading-relaxed text-text-dim">
        <MapIcon size={14} className="mt-0.5 shrink-0" />
        Draft planning estimate only. Equipment selection, conductor sizing, protection, grounding, placement, and code compliance require project-specific technical review.
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
