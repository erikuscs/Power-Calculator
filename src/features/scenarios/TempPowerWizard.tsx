import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { SelectField } from '../../components/ui/SelectField'
import { RadioGroup } from '../../components/ui/RadioGroup'
import { ReportContextFields } from '../../components/ui/ReportContextFields'
import { Button } from '../../components/ui/Button'
import { useCalculator } from '../../hooks/useCalculator'
import {
  calculateTempPowerPlanningBrief,
  calculateTempPowerSchedule,
  type FacilityEntry,
  type RentalPeriod,
  type RuntimeSchedule,
  type TempPowerPlanningInputs,
} from './scenario.formulas'
import { buildFieldVerificationReview, defaultTempPowerRiskInputs, type TempPowerRiskInputs } from './fieldRiskReview'
import { FACILITY_PRESETS, STRUCTURE_COOLING_MULTIPLIERS, VOLTAGE_OPTIONS } from '../../lib/constants'
import { JOBSITE_TRAILER_PRESETS, trailerPresetLabel } from '../../lib/jobsiteTrailerPresets'
import type { TempPowerContinuityTarget } from '../../lib/tempPowerArchitecture'
import { ChevronDown, ClipboardList, ExternalLink, Trash2, X } from 'lucide-react'
import { TempPowerReviewPlan } from './TempPowerReviewPlan'
import { verifyTempPowerPlanningBrief } from './tempPowerVerification'
import { usePersistedState } from '../../hooks/usePersistedState'
import { addPlanningRequirement } from '../estimate/estimateDraft'

type EnergyExampleId = 'data-center' | 'substation' | 'temporary-power'

const ENERGY_EXAMPLES: Record<EnergyExampleId, {
  name: string
  siteVoltage: string
  loadVoltage: string
  continuity: TempPowerContinuityTarget
  facilities: FacilityEntry[]
}> = {
  'data-center': {
    name: 'Data Center Commissioning - Temporary Power',
    siteVoltage: '480', loadVoltage: '208', continuity: 'n_plus_1',
    facilities: [
      { id: 'dc-zone-a', type: 'data_center', label: 'Commissioning Zone A', quantity: 1, kwPerUnit: 700, structureType: 'container', structureMultiplier: 1, loadBasis: 'Synthetic planning load; replace with the project load schedule and measured or nameplate demand.', loadBasisType: 'user-defined' },
      { id: 'dc-zone-b', type: 'data_center', label: 'Commissioning Zone B', quantity: 1, kwPerUnit: 500, structureType: 'container', structureMultiplier: 1, loadBasis: 'Synthetic planning load; verify simultaneity, motor starts, cooling and UPS demand before equipment selection.', loadBasisType: 'user-defined' },
    ],
  },
  substation: {
    name: 'Substation Construction - Temporary Power',
    siteVoltage: '480', loadVoltage: '480', continuity: 'standard',
    facilities: [
      { id: 'substation-commissioning', type: 'substation', label: 'Commissioning Equipment', quantity: 1, kwPerUnit: 250, structureType: 'container', structureMultiplier: 1, loadBasis: 'Synthetic planning load; verify test equipment, start current, grounding and utility interface.', loadBasisType: 'user-defined' },
      { id: 'substation-construction', type: 'substation', label: 'Construction Services', quantity: 1, kwPerUnit: 125, structureType: 'container', structureMultiplier: 1, loadBasis: 'Synthetic planning load; replace with the construction load schedule and operating shifts.', loadBasisType: 'user-defined' },
    ],
  },
  'temporary-power': {
    name: 'Temporary Power - Multi-Load Site',
    siteVoltage: '480', loadVoltage: '480', continuity: 'standard',
    facilities: [
      { id: 'temp-field-load', type: 'temporary_power', label: 'Field Equipment', quantity: 1, kwPerUnit: 180, structureType: 'container', structureMultiplier: 1, loadBasis: 'Synthetic planning load; confirm the equipment schedule and starting demand.', loadBasisType: 'user-defined' },
      { id: 'temp-site-services', type: 'temporary_power', label: 'Site Services', quantity: 1, kwPerUnit: 80, structureType: 'container', structureMultiplier: 1, loadBasis: 'Synthetic planning load; verify lighting, offices and auxiliary services without double counting.', loadBasisType: 'user-defined' },
    ],
  },
}

export default function TempPowerWizard() {
  const navigate = useNavigate()
  const routeKey = '/scenarios/temp-power'
  const [mode, setMode] = usePersistedState<'single' | 'basecamp'>(routeKey, 'mode', 'basecamp')
  const [loadKw, setLoadKw] = usePersistedState(routeKey, 'loadKw', '0')
  const [rentalPeriod, setRentalPeriod] = usePersistedState<RentalPeriod>(routeKey, 'rentalPeriod', 'monthly')
  const [rentalPeriodCount, setRentalPeriodCount] = usePersistedState(routeKey, 'rentalPeriodCount', '1')
  const [runtimeSchedule, setRuntimeSchedule] = usePersistedState<RuntimeSchedule>(routeKey, 'runtimeSchedule', 'continuous_24_7')
  const [includeCooling, setIncludeCooling] = usePersistedState(routeKey, 'includeCooling', false)
  const [coolingDetailsOpen, setCoolingDetailsOpen] = useState(false)
  const [coolingCapacityTons, setCoolingCapacityTons] = usePersistedState(routeKey, 'coolingCapacityTons', '0')
  const [coolingElectricalKw, setCoolingElectricalKw] = usePersistedState(routeKey, 'coolingElectricalKw', '0')
  const [siteVoltage, setSiteVoltage] = usePersistedState(routeKey, 'siteVoltage', '480')
  const [loadVoltage, setLoadVoltage] = usePersistedState(routeKey, 'loadVoltage', '208')
  const [continuityTarget, setContinuityTarget] = usePersistedState<TempPowerContinuityTarget>(routeKey, 'continuityTarget', 'n_plus_1')
  const [clientName, setClientName] = usePersistedState(routeKey, 'clientName', 'Worked Example')
  const [projectName, setProjectName] = usePersistedState(routeKey, 'projectName', ENERGY_EXAMPLES['data-center'].name)
  const [facilities, setFacilities] = usePersistedState<FacilityEntry[]>(routeKey, 'facilities', ENERGY_EXAMPLES['data-center'].facilities)
  const [riskInputs, setRiskInputs] = usePersistedState<TempPowerRiskInputs>(routeKey, 'riskInputs', { ...defaultTempPowerRiskInputs })
  const [requirementsOpen, setRequirementsOpen] = useState(false)
  const [isWorkedExample, setIsWorkedExample] = usePersistedState(routeKey, 'isWorkedExample', true)
  const requirementsHeadingRef = useRef<HTMLHeadingElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const markAsCustomPlan = () => {
    if (!isWorkedExample) return
    setIsWorkedExample(false)
    setClientName('')
    setProjectName('')
  }

  useEffect(() => {
    if (!requirementsOpen) return

    const previousOverflow = document.body.style.overflow
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusFrame = window.requestAnimationFrame(() => requirementsHeadingRef.current?.focus())
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setRequirementsOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
      previousFocusRef.current?.focus()
    }
  }, [requirementsOpen])

  const addFacility = (type: string) => {
    const preset = FACILITY_PRESETS[type]
    if (!preset) return
    markAsCustomPlan()
    setFacilities((prev) => [
      ...prev,
      {
        id: `fac-${Date.now()}-${prev.length}`,
        type,
        label: preset.label,
        quantity: 1,
        kwPerUnit: 0,
        structureType: 'canvas',
        structureMultiplier: STRUCTURE_COOLING_MULTIPLIERS.canvas.multiplier,
        loadBasis: `No load is assumed for this facility type. Enter the planned equipment load from a schedule, submittal, or nameplate.`,
        loadBasisType: 'planning-estimate',
      },
    ])
  }

  const addJobsiteTrailer = (presetId: string) => {
    const preset = JOBSITE_TRAILER_PRESETS.find((item) => item.id === presetId)
    if (!preset) return
    markAsCustomPlan()

    setFacilities((prev) => [
      ...prev,
      {
        id: `trailer-${Date.now()}-${prev.length}`,
        type: 'jobsite_trailer',
        label: `${preset.manufacturer} ${preset.dimensions} ${preset.model}`,
        quantity: 1,
        kwPerUnit: 0,
        structureType: 'container',
        structureMultiplier: STRUCTURE_COOLING_MULTIPLIERS.container.multiplier,
        loadBasis: `${preset.basis} Published electrical context: ${preset.voltage}.`,
        loadBasisType: preset.loadBasis,
        sourceLabel: preset.sourceLabel,
        sourceUrl: preset.sourceUrl,
      },
    ])
  }

  const updateFacility = (id: string, field: string, value: string | number) => {
    markAsCustomPlan()
    setFacilities((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f
        if (field === 'structureType') {
          const mult = STRUCTURE_COOLING_MULTIPLIERS[value as string]?.multiplier ?? 1.0
          return { ...f, structureType: value as string, structureMultiplier: mult }
        }
        return { ...f, [field]: typeof value === 'string' ? parseFloat(value) || 0 : value }
      }),
    )
  }

  const removeFacility = (id: string) => {
    markAsCustomPlan()
    setFacilities((prev) => prev.filter((f) => f.id !== id))
  }

  const updateRiskInput = <K extends keyof TempPowerRiskInputs>(field: K, value: TempPowerRiskInputs[K]) => {
    markAsCustomPlan()
    setRiskInputs((prev) => ({ ...prev, [field]: value }))
  }

  const loadEnergyExample = (exampleId: EnergyExampleId) => {
    const example = ENERGY_EXAMPLES[exampleId]
    setMode('basecamp')
    setLoadKw('0')
    setRentalPeriod('monthly')
    setRentalPeriodCount('1')
    setRuntimeSchedule('continuous_24_7')
    setIncludeCooling(false)
    setCoolingCapacityTons('0')
    setCoolingElectricalKw('0')
    setSiteVoltage(example.siteVoltage)
    setLoadVoltage(example.loadVoltage)
    setContinuityTarget(example.continuity)
    setClientName('Worked Example')
    setProjectName(example.name)
    setFacilities(example.facilities.map((facility) => ({ ...facility })))
    setRiskInputs({ ...defaultTempPowerRiskInputs })
    setCoolingDetailsOpen(false)
    setIsWorkedExample(true)
    setRequirementsOpen(false)
  }

  useEffect(() => {
    if (!isWorkedExample || facilities.length !== 1 || facilities[0].id !== 'sample-jobsite-trailer-56kw') return
    const example = ENERGY_EXAMPLES['data-center']
    setMode('basecamp')
    setLoadKw('0')
    setRentalPeriod('monthly')
    setRentalPeriodCount('1')
    setRuntimeSchedule('continuous_24_7')
    setIncludeCooling(false)
    setCoolingCapacityTons('0')
    setCoolingElectricalKw('0')
    setSiteVoltage(example.siteVoltage)
    setLoadVoltage(example.loadVoltage)
    setContinuityTarget(example.continuity)
    setProjectName(example.name)
    setFacilities(example.facilities.map((facility) => ({ ...facility })))
    setRiskInputs({ ...defaultTempPowerRiskInputs })
  }, [isWorkedExample, facilities, setMode, setLoadKw, setRentalPeriod, setRentalPeriodCount, setRuntimeSchedule, setIncludeCooling, setCoolingCapacityTons, setCoolingElectricalKw, setSiteVoltage, setLoadVoltage, setContinuityTarget, setProjectName, setFacilities, setRiskInputs])

  const useWorkedExampleAsStartingPoint = () => {
    setIsWorkedExample(false)
    setClientName('')
    setProjectName('')
    setRequirementsOpen(true)
  }

  const rentalPeriodCountValue = Number(rentalPeriodCount)
  const rentalPeriodCountValid = Number.isInteger(rentalPeriodCountValue) && rentalPeriodCountValue >= 1
  const effectiveRentalPeriodCount = rentalPeriodCountValid ? rentalPeriodCountValue : 1
  const singleLoadValue = Number(loadKw)
  const singleLoadValid = mode !== 'single' || (Number.isFinite(singleLoadValue) && singleLoadValue > 0)
  const facilitiesValid = mode !== 'basecamp' || (
    facilities.length > 0
    && facilities.every((facility) => Number.isFinite(facility.quantity) && facility.quantity > 0 && Number.isFinite(facility.kwPerUnit) && facility.kwPerUnit > 0)
  )
  const coolingLoadValue = Number(coolingElectricalKw)
  const coolingInputValid = !includeCooling || (Number.isFinite(coolingLoadValue) && coolingLoadValue > 0)
  const clientNameValid = clientName.trim().length > 0
  const projectNameValid = projectName.trim().length > 0
  const planningInputsValid = rentalPeriodCountValid
    && singleLoadValid
    && facilitiesValid
    && coolingInputValid
    && clientNameValid
    && projectNameValid

  const schedule = calculateTempPowerSchedule(
    rentalPeriod,
    effectiveRentalPeriodCount,
    runtimeSchedule,
  )

  const inputs: TempPowerPlanningInputs = {
    mode,
    loadKw: parseFloat(loadKw) || 0,
    durationHours: schedule.operatingHours,
    rentalPeriod,
    rentalPeriodCount: effectiveRentalPeriodCount,
    runtimeSchedule,
    includeCooling,
    coolingCapacityTons: parseFloat(coolingCapacityTons) || 0,
    coolingElectricalKw: parseFloat(coolingElectricalKw) || 0,
    siteVoltage: parseFloat(siteVoltage) || 480,
    loadVoltage: parseFloat(loadVoltage) || parseFloat(siteVoltage) || 480,
    continuityTarget,
    facilities,
  }

  const calculate = useCallback((inp: TempPowerPlanningInputs) => calculateTempPowerPlanningBrief(inp), [])
  const results = useCalculator(inputs, calculate)
  const calculationVerification = results ? verifyTempPowerPlanningBrief(inputs, results) : null
  const fieldRiskReview = results
    ? buildFieldVerificationReview({
        inputs: riskInputs,
        coolingKw: results.coolingKw,
        includeCooling,
        includesRv: facilities.some((facility) => facility.type === 'rv'),
      })
    : null
  const coolingLoadReady = !includeCooling || (results?.coolingKw ?? 0) > 0
  const hasPlanningBrief = Boolean(
    planningInputsValid
    && results
    && results.totalLoadKw > 0
    && coolingLoadReady
    && fieldRiskReview
    && calculationVerification?.passed,
  )

  const facilityOptions = Object.entries(FACILITY_PRESETS).map(([value, { label }]) => ({
    value,
    label,
  }))

  const trailerOptions = JOBSITE_TRAILER_PRESETS.map((preset) => ({
    value: preset.id,
    label: trailerPresetLabel(preset),
  }))

  return (
    <div className="max-w-6xl mx-auto space-y-6 lg:-mt-6">
      {!requirementsOpen && planningInputsValid && coolingLoadReady && results && results.totalLoadKw > 0 && fieldRiskReview && calculationVerification?.passed && (
        <TempPowerReviewPlan
          inputs={inputs}
          results={results}
          calculationVerification={calculationVerification}
          fieldRiskReview={fieldRiskReview}
          riskInputs={riskInputs}
          onRiskChange={(field, value) => updateRiskInput(field, value as never)}
          clientName={clientName}
          projectName={projectName}
          onEditRequirements={() => setRequirementsOpen(true)}
          isWorkedExample={isWorkedExample}
          onUseAsStartingPoint={useWorkedExampleAsStartingPoint}
          onAddToEstimate={() => {
            const added = addPlanningRequirement({
              source: 'temporary_power',
              title: 'Temporary Power Requirement',
              summary: `${results.totalWithCoolingKw.toFixed(1)} kW entered; ${results.operatingHours.toFixed(0)} scheduled hours`,
              details: [
                { label: 'Planning demand', value: `${results.totalWithCoolingKw.toFixed(1)} kW` },
                { label: 'Source / load voltage', value: `${inputs.siteVoltage} V / ${inputs.loadVoltage} V` },
                { label: 'Continuity', value: inputs.continuityTarget === 'n_plus_1' ? 'Generator redundancy' : 'Meet entered load' },
                { label: 'Rental duration', value: `${results.rentalDays} days; ${results.operatingHours.toFixed(0)} scheduled hours` },
              ],
              assumptions: fieldRiskReview.rfis,
            }, { clientName, projectName })
            if (!added) {
              window.alert('The current estimate belongs to another client or project. Open Build Estimate and start a new estimate before importing this result.')
              return
            }
            navigate('/estimate')
          }}
        />
      )}

      {!requirementsOpen && results && calculationVerification && !calculationVerification.passed && (
        <div role="alert" className="rounded-xl border border-error/45 bg-error/10 px-5 py-4 text-sm leading-relaxed text-text">
          The calculation check found an internal mismatch. The planning brief is withheld until the load and schedule totals agree.
        </div>
      )}

      {(!hasPlanningBrief || requirementsOpen) && (
        <div
          role={requirementsOpen ? 'dialog' : undefined}
          aria-modal={requirementsOpen ? true : undefined}
          aria-label={requirementsOpen ? 'Edit temporary power requirements' : undefined}
          className={requirementsOpen ? 'fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-black/75 p-3 backdrop-blur-sm sm:p-6' : ''}
        >
          <div className={requirementsOpen ? 'mx-auto max-w-6xl space-y-4 rounded-2xl border border-sg-600/60 bg-sg-900 p-3 shadow-2xl sm:p-5' : 'space-y-6'}>
            {requirementsOpen && (
              <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sg-600/50 bg-sg-900/95 px-4 py-3 shadow-lg backdrop-blur">
                <div>
                  <h2 ref={requirementsHeadingRef} tabIndex={-1} className="text-lg font-bold text-text outline-none">Edit Requirements</h2>
                  <p className="mt-0.5 text-xs text-text-muted">Changes update the planning brief immediately.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" onClick={() => setRequirementsOpen(false)} disabled={!hasPlanningBrief}>
                    Done
                  </Button>
                  <button
                    type="button"
                    aria-label="Close requirements"
                    onClick={() => setRequirementsOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-sg-600/55 text-text-muted transition-colors hover:border-accent-500/50 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>
            )}

      <Card>
        <CardHeader
          title="Temporary Power Requirements"
          subtitle="Capture the demand, operating schedule, voltage need, and continuity expectation before discussing equipment"
          action={<div className="flex flex-wrap gap-2" aria-label="Illustrative energy project examples">
            <Button type="button" variant="secondary" size="sm" onClick={() => loadEnergyExample('data-center')}><ClipboardList size={14} />Data center</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => loadEnergyExample('substation')}>Substation construction</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => loadEnergyExample('temporary-power')}>Temporary power</Button>
          </div>}
        />

        <ReportContextFields
          clientName={clientName}
          projectName={projectName}
          onClientNameChange={(value) => { markAsCustomPlan(); setClientName(value) }}
          onProjectNameChange={(value) => { markAsCustomPlan(); setProjectName(value) }}
          required
          clientError={clientName.length > 0 && !clientNameValid ? 'Enter a client or account name.' : undefined}
          projectError={projectName.length > 0 && !projectNameValid ? 'Enter a project or phase name.' : undefined}
        />

        <RadioGroup
          label="Sizing Mode"
          value={mode}
          onChange={(v) => { markAsCustomPlan(); setMode(v as 'single' | 'basecamp') }}
          options={[
            { value: 'single', label: 'Single Load' },
            { value: 'basecamp', label: 'Base Camp / Multi-Facility' },
          ]}
        />

        <div className="mt-5 border-t border-sg-600/40 pt-5">
          <RadioGroup
            label="Solution Scope"
            value={includeCooling ? 'power_cooling' : 'power_only'}
            onChange={(value) => {
              const coolingSelected = value === 'power_cooling'
              markAsCustomPlan()
              setIncludeCooling(coolingSelected)
              setCoolingDetailsOpen(coolingSelected)
            }}
            options={[
              { value: 'power_only', label: 'Temporary Power' },
              { value: 'power_cooling', label: 'Power + Cooling' },
            ]}
          />
          <p className="mt-2 text-xs leading-relaxed text-text-dim">
            Temporary cooling is a downstream load. Select the cooling solution first, then enter its electrical demand here.
          </p>
        </div>

        {includeCooling && (
          <details
            className="group mt-4 rounded-lg border border-signal-blue/35 bg-signal-blue/5"
            open={coolingDetailsOpen}
            onToggle={(event) => setCoolingDetailsOpen(event.currentTarget.open)}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-400/70">
              <span>
                <span className="block text-sm font-bold text-text">Temporary Cooling Details</span>
                <span className="mt-1 block text-xs text-text-muted">
                  {parseFloat(coolingElectricalKw) > 0
                    ? `${coolingElectricalKw} kW selected-equipment demand${parseFloat(coolingCapacityTons) > 0 ? ` / ${coolingCapacityTons} tons` : ''}`
                    : 'Enter the selected cooling equipment load before it is added to generator demand.'}
                </span>
              </span>
              <ChevronDown size={18} className="shrink-0 text-text-dim transition-transform group-open:rotate-180" />
            </summary>
            <div className="grid grid-cols-1 gap-4 border-t border-signal-blue/25 px-4 py-4 sm:grid-cols-2">
              <InputField
                label="Cooling Equipment Demand"
                unit="electrical kW"
                value={coolingElectricalKw}
                onChange={(value) => { markAsCustomPlan(); setCoolingElectricalKw(value) }}
                min={0}
                required
                error={!coolingInputValid ? 'Enter an electrical demand greater than 0 kW.' : undefined}
                tooltip="Electrical demand from the selected cooling equipment; do not enter thermal kW"
              />
              <InputField
                label="Cooling Capacity"
                unit="tons"
                value={coolingCapacityTons}
                onChange={(value) => { markAsCustomPlan(); setCoolingCapacityTons(value) }}
                min={0}
                tooltip="Thermal capacity shown for scope context; it is not converted into generator kW"
              />
              <p className="text-xs leading-relaxed text-text-muted sm:col-span-2">
                Use the HVAC Load Assessment to select the cooling solution. This workflow adds only the chosen equipment's electrical demand to the temporary-power plan.
              </p>
            </div>
          </details>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mode === 'single' && (
            <InputField
              label="Equipment Load"
              unit="kW (real power)"
              value={loadKw}
              onChange={(value) => { markAsCustomPlan(); setLoadKw(value) }}
              min={0}
              required
              error={!singleLoadValid ? 'Enter an equipment load greater than 0 kW.' : undefined}
              tooltip="Total electrical load — kW, not kVA"
            />
          )}
          <SelectField
            label="Rental Period"
            value={rentalPeriod}
            onChange={(value) => { markAsCustomPlan(); setRentalPeriod(value as RentalPeriod) }}
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly (28-day cycle)' },
            ]}
            required
          />
          <InputField
            label="Number of Rental Periods"
            unit={rentalPeriod === 'daily' ? 'days' : rentalPeriod === 'weekly' ? 'weeks' : '28-day cycles'}
            value={rentalPeriodCount}
            onChange={(value) => { markAsCustomPlan(); setRentalPeriodCount(value) }}
            min={1}
            step={1}
            required
            error={!rentalPeriodCountValid ? 'Enter a whole number of rental periods, 1 or greater.' : undefined}
          />
          <SelectField
            label="Operating Schedule"
            value={runtimeSchedule}
            onChange={(value) => { markAsCustomPlan(); setRuntimeSchedule(value as RuntimeSchedule) }}
            options={[
              { value: 'shift_8', label: '8-hour shift' },
              { value: 'continuous_24_7', label: '24/7 continuous' },
            ]}
            required
          />
          <div aria-live="polite" className="rounded-lg border border-accent-500/30 bg-accent-500/8 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-accent-300">Scheduled Coverage</div>
            <div className="mt-1 text-sm font-bold text-text">{schedule.operatingHours.toLocaleString()} scheduled hours</div>
            <div className="mt-0.5 text-xs text-text-muted">
              {schedule.rentalDays.toLocaleString()} rental days × {schedule.dailyRuntimeHours} hours/day
            </div>
          </div>
          <SelectField
            label="Source Voltage"
            value={siteVoltage}
            onChange={(value) => { markAsCustomPlan(); setSiteVoltage(value) }}
            options={VOLTAGE_OPTIONS.map((option) => ({ ...option }))}
            tooltip="Voltage expected at the site connection; confirm source phase and frequency separately"
            required
          />
          <SelectField
            label="Load Voltage"
            value={loadVoltage}
            onChange={(value) => { markAsCustomPlan(); setLoadVoltage(value) }}
            options={VOLTAGE_OPTIONS.map((option) => ({ ...option }))}
            tooltip="Voltage required by the connected loads; verify it against delivered-equipment nameplates"
            required
          />
          <RadioGroup
            label="Continuity Need"
            value={continuityTarget}
            onChange={(value) => { markAsCustomPlan(); setContinuityTarget(value as TempPowerContinuityTarget) }}
            options={[
              { value: 'standard', label: 'Meet the entered load' },
              { value: 'n_plus_1', label: 'Plan for one generator unavailable' },
            ]}
          />
        </div>
      </Card>

      {mode === 'basecamp' && (
        <Card>
          <CardHeader
            title="Facility List"
            subtitle="Start with a common trailer model or add another facility. Every auto-filled load remains editable."
          />

          <div className="mb-5 grid grid-cols-1 gap-4 border-y border-sg-600/40 py-5 lg:grid-cols-2">
            <SelectField
              label="Jobsite Trailer Model"
              value=""
              onChange={(value) => { if (value) addJobsiteTrailer(value) }}
              options={[{ value: '', label: 'Select a manufacturer model...' }, ...trailerOptions]}
              tooltip="Adds the selected model and source context. Enter the actual planned load from the delivered-unit submittal or nameplates."
            />
            <div>
              <SelectField
                label="Other Facility Type"
                value=""
                onChange={(v) => { if (v) addFacility(v) }}
                options={[{ value: '', label: 'Add facility...' }, ...facilityOptions]}
              />
            </div>
          </div>

          <p className="mb-5 text-xs leading-relaxed text-text-dim">
            Selecting a model does not infer its operating load. Enter the planned load from the delivered-unit submittal or nameplates, then confirm voltage, phase, HVAC, heat, water heating, appliances, and added plug loads.
          </p>

          {facilities.length === 0 && (
            <p className="text-sm text-text-dim text-center py-4">No facilities added. Select from the dropdown above.</p>
          )}

          <div className="space-y-3">
            {facilities.map((f) => (
              <div key={f.id} className="bg-sg-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text">{f.label}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${f.label}`}
                    onClick={() => removeFacility(f.id)}
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-text-dim transition-colors hover:bg-sg-700 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {f.loadBasis && (
                  <div className="rounded-lg border border-sg-600/45 bg-sg-900/55 px-3 py-2 text-xs leading-relaxed text-text-muted">
                    <span className="font-semibold text-text">
                      {f.loadBasisType === 'published-service' ? 'Manufacturer context' : f.loadBasisType === 'planning-estimate' ? 'Load entry required' : 'Example basis'}:
                    </span>{' '}
                    {f.loadBasis}
                    {f.sourceUrl && (
                      <a href={f.sourceUrl} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 font-semibold text-accent-300 hover:text-accent-200">
                        {f.sourceLabel ?? 'Manufacturer source'} <ExternalLink size={11} aria-hidden="true" />
                      </a>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InputField
                    label="Qty"
                    value={f.quantity}
                    onChange={(v) => updateFacility(f.id, 'quantity', v)}
                    min={1}
                    step={1}
                    error={f.quantity <= 0 ? 'Quantity must be 1 or greater.' : undefined}
                  />
                  <InputField
                    label="Planned Load"
                    unit="kW/unit"
                    value={f.kwPerUnit}
                    onChange={(v) => updateFacility(f.id, 'kwPerUnit', v)}
                    min={0}
                    error={f.kwPerUnit <= 0 ? 'Enter a load greater than 0 kW from a schedule, submittal, or nameplate.' : undefined}
                    tooltip="Use the project load schedule, delivered-unit submittal, or equipment nameplates"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
          </div>
        </div>
      )}
    </div>
  )
}
