import { useState, useCallback, useEffect } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { SelectField } from '../../components/ui/SelectField'
import { RadioGroup } from '../../components/ui/RadioGroup'
import { ReportContextFields } from '../../components/ui/ReportContextFields'
import { Button } from '../../components/ui/Button'
import { useCalculator } from '../../hooks/useCalculator'
import {
  calculateTempPower,
  calculateTempPowerSchedule,
  type FacilityEntry,
  type RentalPeriod,
  type RuntimeSchedule,
  type TempPowerInputs,
} from './scenario.formulas'
import { buildTempPowerOneLineDiagram } from './oneLineDiagram'
import { buildFieldRiskReview, defaultTempPowerRiskInputs, type TempPowerRiskInputs } from './fieldRiskReview'
import { FACILITY_PRESETS, STRUCTURE_COOLING_MULTIPLIERS, VOLTAGE_OPTIONS } from '../../lib/constants'
import { recommendEquipment } from '../../lib/equipmentRecommendations'
import { ClipboardList, Trash2, X } from 'lucide-react'
import { TempPowerReviewPlan } from './TempPowerReviewPlan'

let nextId = 1

export default function TempPowerWizard() {
  const [mode, setMode] = useState<'single' | 'basecamp'>('single')
  const [loadKw, setLoadKw] = useState('200')
  const [sqFt, setSqFt] = useState('2000')
  const [ambientTemp, setAmbientTemp] = useState('95')
  const [targetTemp, setTargetTemp] = useState('72')
  const [rentalPeriod, setRentalPeriod] = useState<RentalPeriod>('monthly')
  const [rentalPeriodCount, setRentalPeriodCount] = useState('1')
  const [runtimeSchedule, setRuntimeSchedule] = useState<RuntimeSchedule>('shift_8')
  const [includeCooling, setIncludeCooling] = useState(false)
  const [altitude, setAltitude] = useState('0')
  const [siteVoltage, setSiteVoltage] = useState('480')
  const [powerFactor, setPowerFactor] = useState('0.8')
  const [serviceIntervalDays, setServiceIntervalDays] = useState('10')
  const [technicianCoverage, setTechnicianCoverage] = useState<'none' | 'business_hours' | '24_7'>('business_hours')
  const [containmentRequired, setContainmentRequired] = useState(true)
  const [noiseFinePerDay, setNoiseFinePerDay] = useState('0')
  const [clientName, setClientName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [facilities, setFacilities] = useState<FacilityEntry[]>([])
  const [riskInputs, setRiskInputs] = useState<TempPowerRiskInputs>(defaultTempPowerRiskInputs)
  const [requirementsOpen, setRequirementsOpen] = useState(false)

  useEffect(() => {
    if (!requirementsOpen) return

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setRequirementsOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [requirementsOpen])

  const addFacility = (type: string) => {
    const preset = FACILITY_PRESETS[type]
    if (!preset) return
    setFacilities((prev) => [
      ...prev,
      {
        id: `fac-${nextId++}`,
        type,
        label: preset.label,
        quantity: 1,
        kwPerUnit: preset.defaultKw,
        structureType: 'canvas',
        structureMultiplier: STRUCTURE_COOLING_MULTIPLIERS.canvas.multiplier,
      },
    ])
  }

  const updateFacility = (id: string, field: string, value: string | number) => {
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
    setFacilities((prev) => prev.filter((f) => f.id !== id))
  }

  const updateRiskInput = <K extends keyof TempPowerRiskInputs>(field: K, value: TempPowerRiskInputs[K]) => {
    setRiskInputs((prev) => ({ ...prev, [field]: value }))
  }

  const loadTempHousingScenario = () => {
    setMode('basecamp')
    setLoadKw('0')
    setSqFt('0')
    setAmbientTemp('95')
    setTargetTemp('72')
    setRentalPeriod('monthly')
    setRentalPeriodCount('33')
    setRuntimeSchedule('continuous_24_7')
    setIncludeCooling(true)
    setAltitude('0')
    setSiteVoltage('480')
    setPowerFactor('0.8')
    setServiceIntervalDays('10')
    setTechnicianCoverage('24_7')
    setContainmentRequired(true)
    setNoiseFinePerDay('0')
    setClientName('Stark Industries')
    setProjectName('Temporary Housing - North Lot')
    setFacilities([
      { id: 'workshop-rv', type: 'rv', label: 'RV Pedestal (50A)', quantity: 60, kwPerUnit: 9.6, structureType: 'container', structureMultiplier: 1.0 },
      { id: 'workshop-bath', type: 'bathroom', label: 'Bathroom Trailer', quantity: 4, kwPerUnit: 14.4, structureType: 'container', structureMultiplier: 1.0 },
      { id: 'workshop-shower', type: 'shower', label: 'Shower Trailer', quantity: 2, kwPerUnit: 57.6, structureType: 'container', structureMultiplier: 1.0 },
      { id: 'workshop-concession', type: 'concession', label: 'Concession Structure', quantity: 2, kwPerUnit: 115.3, structureType: 'sprung', structureMultiplier: 1.4 },
    ])
    setRiskInputs({
      ...defaultTempPowerRiskInputs,
      rvService: 'unknown',
      hiddenPlugLoads: 'unknown',
      motorStarting: 'unknown',
      occupancyVariance: 'assume_typical',
      airDistribution: 'unknown',
      winterHeat: 'unknown',
      waterHeating: 'unknown',
    })
  }

  const schedule = calculateTempPowerSchedule(
    rentalPeriod,
    parseFloat(rentalPeriodCount) || 1,
    runtimeSchedule,
  )

  const inputs: TempPowerInputs = {
    mode,
    loadKw: parseFloat(loadKw) || 0,
    sqFt: parseFloat(sqFt) || 0,
    ambientTemp: parseFloat(ambientTemp) || 95,
    targetTemp: parseFloat(targetTemp) || 72,
    durationHours: schedule.operatingHours,
    rentalPeriod,
    rentalPeriodCount: parseFloat(rentalPeriodCount) || 1,
    runtimeSchedule,
    includeCooling,
    altitude: parseFloat(altitude) || 0,
    siteVoltage: parseFloat(siteVoltage) || 480,
    powerFactor: parseFloat(powerFactor) || 0.8,
    serviceIntervalDays: parseFloat(serviceIntervalDays) || 0,
    technicianCoverage,
    containmentRequired,
    noiseFinePerDay: parseFloat(noiseFinePerDay) || 0,
    facilities,
  }

  const calculate = useCallback((inp: TempPowerInputs) => calculateTempPower(inp), [])
  const results = useCalculator(inputs, calculate)
  const oneLineDiagram = results ? buildTempPowerOneLineDiagram(inputs, results) : null
  const equipmentRecommendation = results
    ? recommendEquipment({
        peakKw: results.totalWithCoolingKw,
        baseKw: results.totalWithCoolingKw * 0.6,
        runtimeHours: results.dailyRuntimeHours,
        projectDurationHours: results.operatingHours,
        peakHoursPerDay: results.dailyRuntimeHours,
        powerFactor: inputs.powerFactor,
        siteVoltage: inputs.siteVoltage,
      })
    : null
  const recommendation = equipmentRecommendation
    ? { ...equipmentRecommendation, preferred: 'generator' as const }
    : null
  const fieldRiskReview = results
    ? buildFieldRiskReview({
        inputs: riskInputs,
        totalLoadKw: results.totalLoadKw,
        coolingKw: results.coolingKw,
        totalWithCoolingKw: results.totalWithCoolingKw,
        powerFactor: inputs.powerFactor,
        includeCooling,
      })
    : null
  const hasRecommendation = Boolean(results && results.totalLoadKw > 0 && recommendation && fieldRiskReview && oneLineDiagram)

  const structureOptions = Object.entries(STRUCTURE_COOLING_MULTIPLIERS).map(([value, { label, multiplier }]) => ({
    value,
    label: `${label} (${multiplier}x)`,
  }))

  const facilityOptions = Object.entries(FACILITY_PRESETS).map(([value, { label, defaultKw, unit }]) => ({
    value,
    label: `${label} — ${defaultKw} kW ${unit}`,
  }))

  return (
    <div className="max-w-6xl mx-auto space-y-6 lg:-mt-6">
      {results && results.totalLoadKw > 0 && recommendation && fieldRiskReview && oneLineDiagram && (
        <TempPowerReviewPlan
          inputs={inputs}
          results={results}
          recommendation={recommendation}
          fieldRiskReview={fieldRiskReview}
          riskInputs={riskInputs}
          onRiskChange={(field, value) => updateRiskInput(field, value as never)}
          oneLineDiagram={oneLineDiagram}
          clientName={clientName}
          projectName={projectName}
          onEditRequirements={() => setRequirementsOpen(true)}
        />
      )}

      {(!hasRecommendation || requirementsOpen) && (
        <div
          role={hasRecommendation ? 'dialog' : undefined}
          aria-modal={hasRecommendation ? true : undefined}
          aria-label={hasRecommendation ? 'Edit temporary power requirements' : undefined}
          className={hasRecommendation ? 'fixed inset-0 z-[70] overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-6' : ''}
        >
          <div className={hasRecommendation ? 'mx-auto max-w-6xl space-y-4 rounded-2xl border border-sg-600/60 bg-sg-900 p-3 shadow-2xl sm:p-5' : 'space-y-6'}>
            {hasRecommendation && (
              <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sg-600/50 bg-sg-900/95 px-4 py-3 shadow-lg backdrop-blur">
                <div>
                  <h2 className="text-lg font-bold text-text">Edit Requirements</h2>
                  <p className="mt-0.5 text-xs text-text-muted">Changes update the recommended package immediately.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" onClick={() => setRequirementsOpen(false)} disabled={!hasRecommendation}>
                    Apply Requirements
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
          subtitle="Start with a standalone generator plan, then add cooling only when the job requires it"
          action={
            <Button type="button" variant="secondary" size="sm" onClick={loadTempHousingScenario}>
              <ClipboardList size={14} />
              Use Example Scenario
            </Button>
          }
        />

        <ReportContextFields
          clientName={clientName}
          projectName={projectName}
          onClientNameChange={setClientName}
          onProjectNameChange={setProjectName}
        />

        <RadioGroup
          label="Sizing Mode"
          value={mode}
          onChange={(v) => setMode(v as 'single' | 'basecamp')}
          options={[
            { value: 'single', label: 'Single Load' },
            { value: 'basecamp', label: 'Base Camp / Multi-Facility' },
          ]}
        />

        <div className="mt-5 border-t border-sg-600/40 pt-5">
          <RadioGroup
            label="Solution Scope"
            value={includeCooling ? 'power_cooling' : 'power_only'}
            onChange={(value) => setIncludeCooling(value === 'power_cooling')}
            options={[
              { value: 'power_only', label: 'Generator Only' },
              { value: 'power_cooling', label: 'Add Temporary Cooling' },
            ]}
          />
          <p className="mt-2 text-xs leading-relaxed text-text-dim">
            The generator remains the base solution. Cooling is sized and added to the package only when selected.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mode === 'single' && (
            <>
              <InputField label="Equipment Load" unit="kW (real power)" value={loadKw} onChange={setLoadKw} required tooltip="Total electrical load — kW, not kVA" />
              {includeCooling && <InputField label="Conditioned Area" unit="sq ft" value={sqFt} onChange={setSqFt} tooltip="Floor area used only for the optional cooling calculation" />}
            </>
          )}
          <InputField label="Ambient Temperature" unit="°F" value={ambientTemp} onChange={setAmbientTemp} required />
          {includeCooling && <InputField label="Target Temperature" unit="°F" value={targetTemp} onChange={setTargetTemp} required />}
          <SelectField
            label="Rental Period"
            value={rentalPeriod}
            onChange={(value) => setRentalPeriod(value as RentalPeriod)}
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly (30 days)' },
            ]}
            required
          />
          <InputField
            label="Number of Rental Periods"
            unit={rentalPeriod === 'daily' ? 'days' : rentalPeriod === 'weekly' ? 'weeks' : 'months'}
            value={rentalPeriodCount}
            onChange={setRentalPeriodCount}
            min={1}
            step={1}
            required
          />
          <SelectField
            label="Operating Schedule"
            value={runtimeSchedule}
            onChange={(value) => setRuntimeSchedule(value as RuntimeSchedule)}
            options={[
              { value: 'shift_8', label: '8-hour shift' },
              { value: 'continuous_24_7', label: '24/7 continuous' },
            ]}
            required
          />
          <div aria-live="polite" className="rounded-lg border border-accent-500/30 bg-accent-500/8 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-accent-300">Calculated Runtime</div>
            <div className="mt-1 text-sm font-bold text-text">{schedule.operatingHours.toLocaleString()} operating hours</div>
            <div className="mt-0.5 text-xs text-text-muted">
              {schedule.rentalDays.toLocaleString()} rental days × {schedule.dailyRuntimeHours} hours/day
            </div>
          </div>
          <InputField label="Altitude" unit="ft ASL" value={altitude} onChange={setAltitude} tooltip="+3% derating per 1,000 ft above 1,000 ft" />
          <SelectField
            label="Site Voltage"
            value={siteVoltage}
            onChange={setSiteVoltage}
            options={VOLTAGE_OPTIONS.map((option) => ({ ...option }))}
            required
          />
          <SelectField
            label="Power Factor"
            value={powerFactor}
            onChange={setPowerFactor}
            options={[
              { value: '0.8', label: '0.8 (typical)' },
              { value: '0.85', label: '0.85' },
              { value: '0.9', label: '0.9' },
              { value: '1.0', label: '1.0 (unity)' },
            ]}
            required
          />
          <InputField label="PM Service Interval" unit="days" value={serviceIntervalDays} onChange={setServiceIntervalDays} tooltip="Planned maintenance cadence for generators and temporary power assets" />
          <SelectField
            label="Technician Coverage"
            value={technicianCoverage}
            onChange={(v) => setTechnicianCoverage(v as 'none' | 'business_hours' | '24_7')}
            options={[
              { value: 'none', label: 'None / customer managed' },
              { value: 'business_hours', label: 'Business hours' },
              { value: '24_7', label: '24/7 field technician' },
            ]}
          />
          <SelectField
            label="Containment Required"
            value={containmentRequired ? 'yes' : 'no'}
            onChange={(v) => setContainmentRequired(v === 'yes')}
            options={[
              { value: 'yes', label: 'Yes - 110% contained' },
              { value: 'no', label: 'No - confirm site spec' },
            ]}
          />
          <InputField label="Night Noise Fine" unit="$/day" value={noiseFinePerDay} onChange={setNoiseFinePerDay} tooltip="Daily fine exposure if site noise limits are exceeded" />
        </div>
      </Card>

      {mode === 'basecamp' && (
        <Card>
          <CardHeader
            title="Facility List"
            subtitle="Add facilities — override loads if you know the real number from experience"
            action={
              <SelectField
                label=""
                value=""
                onChange={(v) => { if (v) addFacility(v) }}
                options={[{ value: '', label: 'Add facility...' }, ...facilityOptions]}
              />
            }
          />

          {facilities.length === 0 && (
            <p className="text-sm text-text-dim text-center py-4">No facilities added. Select from the dropdown above.</p>
          )}

          <div className="space-y-3">
            {facilities.map((f) => (
              <div key={f.id} className="bg-sg-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text">{f.label}</span>
                  <button onClick={() => removeFacility(f.id)} className="text-text-dim hover:text-error transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className={`grid gap-3 ${includeCooling ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                  <InputField label="Qty" value={f.quantity} onChange={(v) => updateFacility(f.id, 'quantity', v)} />
                  <InputField label="kW/unit" value={f.kwPerUnit} onChange={(v) => updateFacility(f.id, 'kwPerUnit', v)} tooltip="Override if you know better" />
                  {includeCooling && <SelectField label="Structure" value={f.structureType} onChange={(v) => updateFacility(f.id, 'structureType', v)} options={structureOptions} />}
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
