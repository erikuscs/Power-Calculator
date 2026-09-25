import { useState, useCallback, useMemo } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { SelectField } from '../../components/ui/SelectField'
import { RadioGroup } from '../../components/ui/RadioGroup'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { Button } from '../../components/ui/Button'
import { PdfExportButton } from '../../components/pdf/PdfExportButton'
import { ReportContextFields } from '../../components/ui/ReportContextFields'
import { ChartFrame } from '../../components/ui/ChartFrame'
import { OneLineDiagramPanel } from '../../components/ui/OneLineDiagramPanel'
import { HybridSiteLayout3D } from '../../components/ui/HybridSiteLayout3D'
import { SpecSummaryPanel, type SpecSummaryTone } from '../../components/ui/SpecSummaryPanel'
import { useCalculator } from '../../hooks/useCalculator'
import { calculateHybridWizard, type HybridWizardInputs, type MotorEntry, type BessUnitSize } from './scenario.formulas'
import { reviewHybridBenchmark } from './hybridBenchmark'
import { buildHybridProjectPlan } from './hybridProjectPlan'
import { buildHybridOneLineDiagram } from './oneLineDiagram'
import { BESS_UNIT_SIZES, RATE_PERIOD_OPTIONS, VOLTAGE_OPTIONS, type RatePeriod, SQRT3 } from '../../lib/constants'
import { BESS_FLEET, normalizeRateToDaily } from '../../lib/equipmentRecommendations'
import { addPlanningRequirement } from '../estimate/estimateDraft'
import { DEFAULT_SITE_FIT_INPUTS } from '../site-fit/siteFit'
import { fmt, fmtInt, fmtCurrency } from '../../lib/formatters'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, AreaChart, Area,
} from 'recharts'
import { Plus, Trash2, AlertCircle, AlertTriangle, Info, Fuel, DollarSign, Leaf, ChevronDown, ChevronRight } from 'lucide-react'

let nextMotorId = 1

function formatPeakDuration(hours?: number): string {
  if (!hours) return ''
  if (hours >= 1) return `${hours} hour${hours === 1 ? '' : 's'}`
  const minutes = hours * 60
  if (minutes >= 1) return `${Math.round(minutes)} minutes`
  return `${Math.round(hours * 3600)} seconds`
}

const coverageStatusLabel = {
  '24_7_ready': 'Modeled 24/7 capacity',
  conditional: 'Conditional',
  not_feasible: 'Not feasible',
} as const

const coverageStatusClass = {
  '24_7_ready': 'border-signal-blue/35 bg-signal-blue/10 text-signal-blue',
  conditional: 'border-warning/35 bg-warning/10 text-warning',
  not_feasible: 'border-error/35 bg-error/10 text-error',
} as const

export default function HybridEnergyWizard() {
  const [peakLoadKw, setPeakLoadKw] = useState('1200')
  const [baseLoadKw, setBaseLoadKw] = useState('800')
  const [loadSource, setLoadSource] = useState<'panel' | 'measured'>('measured')
  const [bessUnitSize, setBessUnitSize] = useState<string>('250')
  const [peakHoursPerDay, setPeakHoursPerDay] = useState('8')
  const [projectDays, setProjectDays] = useState('28')
  const [redundancy, setRedundancy] = useState('n1')
  const [siteVoltage, setSiteVoltage] = useState('480')
  const [altitude, setAltitude] = useState('0')
  const [ambientTemp, setAmbientTemp] = useState('85')
  const [fuelCost, setFuelCost] = useState('8.50')
  const [bessRental, setBessRental] = useState('9800')
  const [bessRatePeriod, setBessRatePeriod] = useState<RatePeriod>('monthly')
  const [genRental, setGenRental] = useState('14000')
  const [genRatePeriod, setGenRatePeriod] = useState<RatePeriod>('monthly')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [motors, setMotors] = useState<MotorEntry[]>([])
  const [zones, setZones] = useState<{id: string, name: string, kw: number}[]>([
    { id: 'dc-zone-a', name: 'Commissioning Zone A', kw: 700 },
    { id: 'dc-zone-b', name: 'Commissioning Zone B', kw: 500 },
  ])
  const [zonesExpanded, setZonesExpanded] = useState(false)
  const [clientName, setClientName] = useState('Synthetic example')
  const [projectName, setProjectName] = useState('Data Center Commissioning - 28-day rental cycle')
  const [powerFactor, setPowerFactor] = useState('0.8')
  const [loadVoltage, setLoadVoltage] = useState('480')
  const [longestCableRouteFt, setLongestCableRouteFt] = useState('100')
  const [neutralPlan, setNeutralPlan] = useState<'required' | 'not_carried' | 'review'>('required')
  const [siteLengthFt, setSiteLengthFt] = useState('200')
  const [siteWidthFt, setSiteWidthFt] = useState('120')

  let nextZoneId = 1

  const addZone = () => {
    setZones((prev) => [...prev, { id: `zone-${Date.now()}-${nextZoneId++}`, name: `Zone ${prev.length + 1}`, kw: 0 }])
  }

  const updateZone = (id: string, field: 'name' | 'kw', value: string | number) => {
    setZones((prev) => prev.map((z) => z.id === id ? { ...z, [field]: field === 'kw' ? (parseFloat(value as string) || 0) : value } : z))
  }

  const removeZone = (id: string) => setZones((prev) => prev.filter((z) => z.id !== id))

  const addMotor = () => {
    setMotors((prev) => [...prev, { id: `motor-${nextMotorId++}`, hp: 50, startMethod: 'dol', fla: 65 }])
  }

  const updateMotor = (id: string, field: string, value: string | number) => {
    setMotors((prev) => prev.map((m) => m.id === id ? { ...m, [field]: field === 'startMethod' ? value : (parseFloat(value as string) || 0) } : m))
  }

  const removeMotor = (id: string) => setMotors((prev) => prev.filter((m) => m.id !== id))

  const defaultBessRentalRate = bessRatePeriod === 'monthly' ? 9800 : bessRatePeriod === 'weekly' ? 2450 : 350
  const defaultGenRentalRate = genRatePeriod === 'monthly' ? 14000 : genRatePeriod === 'weekly' ? 3500 : 500
  const parsedProjectDays = parseFloat(projectDays)
  const parsedFuelCost = parseFloat(fuelCost)
  const parsedBessRentalRate = parseFloat(bessRental)
  const parsedGenRentalRate = parseFloat(genRental)
  const enteredBessRentalRate = Number.isFinite(parsedBessRentalRate) ? parsedBessRentalRate : defaultBessRentalRate
  const enteredGenRentalRate = Number.isFinite(parsedGenRentalRate) ? parsedGenRentalRate : defaultGenRentalRate

  const inputs: HybridWizardInputs = {
    peakLoadKw: parseFloat(peakLoadKw) || 0,
    baseLoadKw: parseFloat(baseLoadKw) || 0,
    loadSource,
    bessUnitSize: parseInt(bessUnitSize) as BessUnitSize,
    peakHoursPerDay: parseFloat(peakHoursPerDay) || 8,
    projectDurationDays: Number.isFinite(parsedProjectDays) ? parsedProjectDays : 28,
    redundancy: redundancy as 'field_verify' | 'n' | 'n1' | '2n',
    siteVoltage: parseInt(siteVoltage) || 480,
    altitude: parseFloat(altitude) || 0,
    ambientTemp: parseFloat(ambientTemp) || 85,
    fuelCostPerGallon: Number.isFinite(parsedFuelCost) ? parsedFuelCost : 8.5,
    bessRentalPerDay: normalizeRateToDaily(enteredBessRentalRate, bessRatePeriod),
    genRentalPerDay: normalizeRateToDaily(enteredGenRentalRate, genRatePeriod),
    bessRentalRate: enteredBessRentalRate,
    bessRentalRatePeriod: bessRatePeriod,
    genRentalRate: enteredGenRentalRate,
    genRentalRatePeriod: genRatePeriod,
    startDate,
    endDate,
    motors,
    powerFactor: parseFloat(powerFactor) || 0.8,
    loadVoltage: parseInt(loadVoltage) || 480,
    longestCableRouteFt: parseFloat(longestCableRouteFt) || 100,
    neutralPlan,
    siteLengthFt: parseFloat(siteLengthFt) || 200,
    siteWidthFt: parseFloat(siteWidthFt) || 120,
  }
  const selectedBessFleet = BESS_FLEET.find((unit) => unit.kw === inputs.bessUnitSize)

  const calculate = useCallback((inp: HybridWizardInputs) => {
    // Inverted or negative loads produce nonsense (invalid fuel differences, BESS sized beyond peak)
    if (inp.baseLoadKw < 0 || inp.baseLoadKw > inp.peakLoadKw) return null
    if (inp.projectDurationDays < 1 || inp.fuelCostPerGallon < 0 || inp.bessRentalPerDay < 0 || inp.genRentalPerDay < 0) return null
    return calculateHybridWizard(inp)
  }, [])
  const results = useCalculator(inputs, calculate)
  const benchmarkReview = results ? reviewHybridBenchmark(inputs, results) : null
  const oneLineDiagram = results ? buildHybridOneLineDiagram(inputs, results, zones) : null
  const projectPlan = results ? buildHybridProjectPlan(inputs, results, zones) : null
  const zonesTotalKw = zones.reduce((sum, zone) => sum + zone.kw, 0)
  const zonesBalanced = zones.length === 0 || (zones.every((zone) => zone.kw > 0) && Math.abs(zonesTotalKw - inputs.peakLoadKw) <= 1)
  const formatQuoteRate = (rate: number, rateUnit: string) => rateUnit === 'gallon'
    ? rate.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : fmtCurrency(rate)

  const fuelComparisonData = useMemo(() => {
    if (!results) return []
    return [
      { metric: 'Daily Fuel (gal)', allGen: Math.round(results.allGenFuelPerDay), hybrid: Math.round(results.hybridFuelPerDay) },
      { metric: `${inputs.projectDurationDays}-Day Fuel (gal)`, allGen: Math.round(results.allGenFuelProject), hybrid: Math.round(results.hybridFuelTotal) },
    ]
  }, [results, inputs.projectDurationDays])

  const cumulativeReductionData = useMemo(() => {
    if (!results) return []
    return results.dailyFuelData.filter((_, i) => i % Math.max(1, Math.floor(results.dailyFuelData.length / 60)) === 0 || i === results.dailyFuelData.length - 1)
  }, [results])

  const capacityBarData = useMemo(() => {
    if (!results) return []
    return [
      { name: 'System', base: results.genCapacityKw, peak: results.bessUnits * results.bessUnitContinuousKw, reserve: Math.max(0, results.totalCapacityKw - results.genCapacityKw - results.bessUnits * results.bessUnitContinuousKw) },
    ]
  }, [results])

  const hybridSpecSummary = results && projectPlan
    ? (() => {
        const primaryScenario = results.coverage.scenarios[0]
        const fallbackScenario = results.coverage.scenarios.find((scenario) => scenario.label.includes('Generator-backed'))
        const cableLegs = Math.max(1, Math.ceil(results.peakAmpsPerPhase / 400))
        const rechargeWindow = results.coverage.estimatedRechargeHours === null
          ? 'No reserve'
          : `${fmt(results.coverage.estimatedRechargeHours, 1)} hrs`
        const statusTone: SpecSummaryTone = primaryScenario.status === '24_7_ready'
          ? 'info'
          : primaryScenario.status === 'conditional' ? 'warning' : 'warning'
        const statusLabel = primaryScenario.status === '24_7_ready'
          ? fallbackScenario?.status === '24_7_ready' ? 'Modeled 24/7 fallback capacity' : 'Modeled 24/7 hybrid capacity'
          : primaryScenario.status === 'conditional' ? 'Conditional hybrid coverage' : 'Needs redesign'

        return {
          statusLabel,
          statusTone,
          metrics: [
            {
              label: 'Recommended Package',
              value: `${results.genUnits} × ${results.genUnitSizeKw} kW gen + ${results.bessUnits} × ${results.bessUnitContinuousKw} kW-continuous BESS`,
              detail: `${results.generatorRequiredUnits} duty + ${results.generatorStandbyUnits} standby generator unit(s); BESS quantity is governed by continuous output`,
            },
            {
              label: 'Load Profile',
              value: `${fmtInt(inputs.peakLoadKw)} / ${fmtInt(inputs.baseLoadKw)} kW`,
              detail: 'Peak / base demand',
            },
            {
              label: 'Installed Capacity',
              value: `${results.bessUnits} BESS + ${results.genUnits} gen`,
              detail: `${fmtInt(results.coverage.bessInstalledKw)} kW BESS, ${fmtInt(results.genCapacityKw)} kW installed / ${fmtInt(results.generatorFirmCapacityKw)} kW firm generator`,
            },
            {
              label: 'Footprint',
              value: `~${fmtInt(projectPlan.equipmentEnvelopeSqFt)} sq ft`,
              detail: `${projectPlan.siteLengthFt} × ${projectPlan.siteWidthFt} ft site envelope; includes planning clearances`,
            },
            {
              label: 'Distribution',
              value: `${inputs.siteVoltage} V, ${cableLegs} leg${cableLegs === 1 ? '' : 's'}/phase`,
              detail: `${fmt(results.peakAmpsPerPhase, 0)} A/phase at peak`,
            },
            {
              label: 'Recharge Reserve',
              value: `${fmtInt(results.coverage.generatorRechargeReserveKw)} kW`,
              detail: `${fmtInt(results.rechargePowerKw)} kW modeled charge power; 30% to 80% SOC in ${rechargeWindow}`,
            },
            {
              label: 'Battery Runtime',
              value: `${fmt(results.batteryRuntimeHoursPerCycle, 1)} hrs`,
              detail: 'At the entered average load, from 80% down to the 30% generator-start threshold',
            },
            {
              label: 'Fuel Signal',
              value: `${fmtInt(Math.abs(results.dailyFuelReduction))} gal/day ${results.dailyFuelReduction >= 0 ? 'lower' : 'higher'}`,
              detail: `${fmtCurrency(Math.abs(results.totalFuelCostDifferenceDollars))} estimated project fuel cost ${results.totalFuelCostDifferenceDollars >= 0 ? 'reduction' : 'increase'} after recharge losses`,
            },
          ],
          steps: [
            {
              label: 'BESS serves load',
              detail: 'Battery/PCS carries the full protected load from 80% down to the 30% SOC start threshold. Generator fuel burn is zero during this interval.',
            },
            {
              label: 'EMS starts gen',
              detail: 'Remote start fires the generator when SOC, load, or reserve threshold requires recharge.',
            },
            {
              label: 'Generator carries load',
              detail: 'Generator supports the customer load and uses reserved capacity to fast-charge the BESS from 30% toward 80%.',
            },
            {
              label: 'ATS / gear transfers',
              detail: 'ATS or paralleling gear manages source handoff, synchronization, and protected feeder output.',
            },
            {
              label: 'Switchgear feeds loads',
              detail: 'Main switchgear, transformers, and branch panels distribute power to protected zones.',
            },
          ],
          notes: [
            `Generator basis: ${fmtInt(inputs.peakLoadKw)} kW protected load + ${fmtInt(results.rechargePowerKw)} kW aggregate continuous BESS charging.`,
            primaryScenario.requirement,
            fallbackScenario?.requirement ?? 'Define load-shed rules if generator fallback cannot carry the full protected peak.',
            inputs.siteVoltage <= 240 && inputs.peakLoadKw >= 500
              ? 'Large low-voltage systems create high current; consider 480 V distribution with step-down transformers.'
              : 'Confirm cable length, voltage drop, grounding, OCPD ratings, and protection coordination.',
            'Keep the printable one-line with the load schedule, cable schedule, fuel plan, and engineering review package.',
          ],
        }
      })()
    : null

  const syncToSiteFit = () => {
    if (!results || !projectPlan || !zonesBalanced) return
    let current = DEFAULT_SITE_FIT_INPUTS
    try {
      const saved = window.localStorage.getItem('power-calc:site-fit:inputs')
      if (saved) current = { ...current, ...JSON.parse(saved) }
    } catch {
      current = DEFAULT_SITE_FIT_INPUTS
    }
    window.localStorage.setItem('power-calc:site-fit:inputs', JSON.stringify({
      ...current,
      requestedPowerKw: inputs.peakLoadKw,
      sourceVoltage: inputs.siteVoltage,
      loadVoltage: inputs.loadVoltage,
      powerFactor: inputs.powerFactor,
      longestRouteFt: inputs.longestCableRouteFt,
      neutralPlan: inputs.neutralPlan,
      siteLengthFt: inputs.siteLengthFt,
      siteWidthFt: inputs.siteWidthFt,
      scenario: 'hybrid',
      continuity: inputs.redundancy === 'n1' || inputs.redundancy === 'field_verify' ? 'n_plus_1' : 'standard',
      packageOverride: {
        source: 'hybrid',
        generatorCount: results.genUnits,
        generatorRequiredUnits: results.generatorRequiredUnits,
        generatorUnitKw: results.genUnitSizeKw,
        generatorFirmCapacityKw: results.generatorFirmCapacityKw,
        bessCount: results.bessUnits,
        bessUnitKw: results.bessUnitContinuousKw,
        bessUnitKwh: results.bessUnitUsableKwh,
        layoutFits: projectPlan.layoutFits,
        equipmentEnvelopeSqFt: projectPlan.equipmentEnvelopeSqFt,
        totalCablePieces: projectPlan.totalCablePieces,
        totalCablePieceRange: projectPlan.totalCablePieceRange,
        layoutEquipment: projectPlan.equipment,
      },
    }))
    window.history.pushState({}, '', '/site-fit')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const addPackageToEstimate = () => {
    if (!results || !projectPlan || !zonesBalanced) return
    const cableCount = projectPlan.totalCablePieces ?? `${projectPlan.totalCablePieceRange?.[0]}-${projectPlan.totalCablePieceRange?.[1]}`
    const added = addPlanningRequirement({
      source: 'hybrid',
      title: 'Reconciled hybrid generator + BESS package',
      summary: `${results.genUnits} × ${results.genUnitSizeKw} kW generators and ${results.bessUnits} × ${results.bessUnitContinuousKw} kW-continuous BESS units for ${inputs.peakLoadKw.toLocaleString()} kW peak / ${inputs.baseLoadKw.toLocaleString()} kW base.`,
      details: [
        { label: 'Generator topology', value: `${results.generatorRequiredUnits} duty + ${results.generatorStandbyUnits} standby; ${results.generatorFirmCapacityKw.toLocaleString()} kW firm` },
        { label: 'BESS installed', value: `${results.coverage.bessInstalledKw.toLocaleString()} kW / ${results.coverage.bessInstalledKwh.toLocaleString()} kWh` },
        { label: 'Cable schedule', value: `${cableCount} planning 50-ft pieces; neutral ${inputs.neutralPlan}` },
        { label: 'Budgetary entered-rate total', value: fmtCurrency(projectPlan.budgetaryTotal) },
      ],
      assumptions: [projectPlan.neutralExplanation, 'Vendor availability, model/SKU, cable ampacity, protection, delivery, labor, taxes, and every zero-rate line remain unconfirmed.'],
    }, { clientName, projectName }, projectPlan.quoteItems.map((item) => ({
      id: `hybrid-${item.id}`,
      category: item.category,
      description: item.description,
      modelSku: item.modelSku,
      quantity: item.quantity,
      rate: item.rate,
      periods: item.periods,
      rateUnit: item.rateUnit,
    })))
    window.alert(added ? 'Reconciled hybrid package added to Build Estimate. Vendor-required lines remain at $0 until confirmed.' : 'The current estimate belongs to another client or project. Open Build Estimate and start a new estimate before importing this package.')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Step 1: Requirements */}
      <Card>
        <CardHeader title="Hybrid EMaaS Strategy - BESS + Generator" subtitle="Design redundant systems for construction, commissioning, and mission-critical loads" />

        <div className="mb-5 flex flex-col gap-3 rounded-lg border border-signal-blue/35 bg-signal-blue/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-text">2,000 A / 480 V hybrid worked example</p>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">Four modular 500 kW generators, seven 250 kW-continuous BESS units, DEIF controls, one-line, and a scaled site layout. Historical telemetry is intentionally excluded.</p>
          </div>
          <a
            href="/examples/2000a-hybrid"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-signal-blue/50 bg-sg-900 px-4 py-2 text-sm font-bold text-signal-blue transition-colors hover:bg-sg-800"
          >
            View Live Example
          </a>
        </div>

        <ReportContextFields
          clientName={clientName}
          projectName={projectName}
          onClientNameChange={setClientName}
          onProjectNameChange={setProjectName}
        />

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Peak Load Demand" unit="kW" value={peakLoadKw} onChange={setPeakLoadKw} required tooltip="Maximum load the system must handle" max={25000} />
            <InputField
              label="Base/Continuous Load"
              unit="kW"
              value={baseLoadKw}
              onChange={setBaseLoadKw}
              required
              tooltip="Average continuous load — generators sized for this"
              error={inputs.peakLoadKw > 0 && inputs.baseLoadKw > inputs.peakLoadKw ? 'Base load cannot exceed peak load' : undefined}
            />
          </div>

          <RadioGroup
            label="Load Source"
            value={loadSource}
            onChange={(v) => setLoadSource(v as 'panel' | 'measured')}
            options={[
              { value: 'measured', label: 'Actual Measured Load' },
              { value: 'panel', label: 'Breaker Panel Rating' },
            ]}
          />
          {loadSource === 'panel' && (
            <div className="flex items-start gap-2 px-3 py-2 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              Panel-rated sizing often oversizes by 50-75%. Consider measuring actual load to right-size equipment and reduce costs.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SelectField
              label="BESS Unit Size"
              value={bessUnitSize}
              onChange={setBessUnitSize}
              options={BESS_UNIT_SIZES.map((s) => {
                const fleet = BESS_FLEET.find((unit) => unit.kw === s)
                return { value: String(s), label: fleet ? fleet.label : `${s} kW legacy / large-system option` }
              })}
              required
            />
            <SelectField
              label="Redundancy Level"
              value={redundancy}
              onChange={setRedundancy}
              options={[
                { value: 'field_verify', label: 'Field verify before final design' },
                { value: 'n', label: 'N (no redundancy)' },
                { value: 'n1', label: 'N+1 (recommended)' },
                { value: '2n', label: '2N (full redundancy)' },
              ]}
            />
            <SelectField
              label="Site Voltage"
              value={siteVoltage}
              onChange={setSiteVoltage}
              options={VOLTAGE_OPTIONS.map((option) => ({ ...option }))}
            />
          </div>
          {selectedBessFleet && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <div>
                <p><strong>Continuous power controls BESS quantity:</strong> {selectedBessFleet.label}.</p>
                <p className="mt-1">{fmtInt(inputs.peakLoadKw)} kW protected load ÷ {fmt(selectedBessFleet.continuousKw ?? selectedBessFleet.kw, 1)} kW continuous per unit = <strong>{Math.ceil(inputs.peakLoadKw / (selectedBessFleet.continuousKw ?? selectedBessFleet.kw))} unit(s) minimum</strong>.</p>
                {selectedBessFleet.peakKw && selectedBessFleet.peakKw > (selectedBessFleet.continuousKw ?? selectedBessFleet.kw) && (
                  <p className="mt-1">The {selectedBessFleet.peakKw} kW figure is time-limited{selectedBessFleet.peakDurationHours ? ` to ${formatPeakDuration(selectedBessFleet.peakDurationHours)}` : ''}; it may absorb a surge or inrush but cannot carry that load continuously.</p>
                )}
                <p className="mt-1"><strong>A BESS has no operator-usable red zone.</strong> Continuous kW governs this estimate. Motor starting, protection, transformers, and load-bank methods remain later vendor/engineering verification and do not change the planning quantity here.</p>
                {selectedBessFleet.fieldNote && <p className="mt-1">Field note: {selectedBessFleet.fieldNote}</p>}
                <p className="mt-1 text-xs">Public engineering basis: <a className="underline" href="https://www.generac.com/industrial/tools-resources/white-papers/battery-energy-storage-for-emergency-power-systems/" target="_blank" rel="noreferrer">Generac motor-start guidance</a> states that inverter capacity may need to be significantly larger than steady load to prevent overload shutdown. Customer-specific incidents remain field evidence unless independently documented.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InputField label="Power Factor" value={powerFactor} onChange={setPowerFactor} min={0.1} max={1} step="0.01" />
            <SelectField label="Load Voltage" value={loadVoltage} onChange={setLoadVoltage} options={VOLTAGE_OPTIONS.map((option) => ({ ...option }))} />
            <InputField label="Longest Cable Route" unit="ft" value={longestCableRouteFt} onChange={setLongestCableRouteFt} min={1} />
            <SelectField label="Neutral Plan" value={neutralPlan} onChange={(value) => setNeutralPlan(value as typeof neutralPlan)} options={[
              { value: 'required', label: 'Carry neutral — A/B/C/N/G' },
              { value: 'not_carried', label: 'No neutral — line-to-line only' },
              { value: 'review', label: 'Unresolved — show range' },
            ]} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Available Site Length" unit="ft" value={siteLengthFt} onChange={setSiteLengthFt} min={40} />
            <InputField label="Available Site Width" unit="ft" value={siteWidthFt} onChange={setSiteWidthFt} min={30} />
          </div>
          {redundancy === 'field_verify' && (
            <div className="flex items-start gap-2 px-3 py-2 bg-info/10 border border-info/30 rounded-lg text-sm text-info">
              <Info size={14} className="mt-0.5 shrink-0" />
              Field verify uses N+1 planning capacity until the redundancy requirement is confirmed.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InputField label="Peak Hours/Day" unit="hrs" value={peakHoursPerDay} onChange={setPeakHoursPerDay} min={0} max={24} />
            <InputField label="Project Duration" unit="days" value={projectDays} onChange={setProjectDays} min={1} />
            <InputField label="Start Date" type="date" value={startDate} onChange={setStartDate} />
            <InputField label="End Date" type="date" value={endDate} onChange={setEndDate} tooltip="Or use duration" />
          </div>
          <p className="text-xs leading-relaxed text-text-dim">The worked case is a 24/7 jobsite over one 28-day rental cycle (672 operating hours). The BESS carries the protected load with no fuel burn from 80% down to 30% SOC. At 30%, the generator starts, carries the live load, and fast-charges the BESS toward 80%; it then shuts down and returns the load to BESS. Fuel includes only generator-on time and modeled charging losses. The $8.50/gal fuel price is an editable example assumption, not a supplier quote.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InputField label="Altitude" unit="ft ASL" value={altitude} onChange={setAltitude} />
            <InputField label="Ambient Temperature" unit="°F" value={ambientTemp} onChange={setAmbientTemp} />
            <InputField label="Fuel Cost" unit="$/gal" value={fuelCost} onChange={setFuelCost} min={0} />
            <InputField label="BESS Rental" unit={`$/${bessRatePeriod}/unit`} value={bessRental} onChange={setBessRental} min={0} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SelectField
              label="BESS Rate Period"
              value={bessRatePeriod}
              onChange={(v) => setBessRatePeriod(v as RatePeriod)}
              options={RATE_PERIOD_OPTIONS.map((option) => ({ ...option }))}
            />
            <InputField label="Generator Rental" unit={`$/${genRatePeriod}/unit`} value={genRental} onChange={setGenRental} min={0} />
            <SelectField
              label="Generator Rate Period"
              value={genRatePeriod}
              onChange={(v) => setGenRatePeriod(v as RatePeriod)}
              options={RATE_PERIOD_OPTIONS.map((option) => ({ ...option }))}
            />
          </div>
          <p className="text-xs leading-relaxed text-text-dim">The worked example uses one 28-day equipment billing cycle. Changing the project duration prorates the planning comparison; confirm minimum charges, overtime, partial-cycle rules, delivery, and taxes with the rental provider.</p>
        </div>
      </Card>

      {results && inputs.peakLoadKw > 0 && hybridSpecSummary && (
        <SpecSummaryPanel
          title="Streamlined Hybrid Spec"
          subtitle="Recommended package, operating sequence, footprint, and handoff notes"
          statusLabel={hybridSpecSummary.statusLabel}
          statusTone={hybridSpecSummary.statusTone}
          metrics={hybridSpecSummary.metrics}
          steps={hybridSpecSummary.steps}
          notes={hybridSpecSummary.notes}
          action={zonesBalanced ? (
            <PdfExportButton
              createDocument={async () => {
                const { HybridEnergyPdfDoc } = await import('./HybridEnergyPdf')
                return <HybridEnergyPdfDoc inputs={inputs} results={results} zones={zones} clientName={clientName} projectName={projectName} />
              }}
              filename="emaas-hybrid-energy-report.pdf"
              label="Generate Report"
            />
          ) : <p role="alert" className="max-w-xs text-right text-xs font-semibold text-warning">Balance the named power zones to the peak load before generating the report.</p>}
        />
      )}

      {/* Motor Loads */}
      <Card>
        <CardHeader
          title="Motor / Compressor Loads"
          subtitle="Optional handoff notes only; these entries do not change the continuous-power estimate"
          action={<Button size="sm" variant="secondary" onClick={addMotor}><Plus size={14} /> Add Motor</Button>}
        />
        {motors.length === 0 && (
          <p className="text-sm text-text-dim text-center py-3">No motor starts entered. BESS compatibility remains unverified; add the project motor and compressor schedule.</p>
        )}
        <div className="space-y-3">
          {motors.map((m) => (
            <div key={m.id} className="bg-sg-800 rounded-lg p-3">
              <div className="grid grid-cols-4 gap-3 items-end">
                <InputField label="HP" value={m.hp} onChange={(v) => updateMotor(m.id, 'hp', v)} />
                <InputField label="FLA" unit="A" value={m.fla} onChange={(v) => updateMotor(m.id, 'fla', v)} tooltip="Full Load Amps from nameplate" />
                <SelectField
                  label="Start Method"
                  value={m.startMethod}
                  onChange={(v) => updateMotor(m.id, 'startMethod', v)}
                  options={[
                    { value: 'dol', label: 'DOL (6-8x FLA)' },
                    { value: 'soft_start', label: 'Soft Start (2-4x)' },
                    { value: 'vfd', label: 'VFD (1-1.5x)' },
                  ]}
                />
                <button onClick={() => removeMotor(m.id)} className="text-text-dim hover:text-error mb-2">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Power Zones — only when peak > 500 kW */}
      {inputs.peakLoadKw > 500 && (
        <Card>
          <button
            className="w-full flex items-center justify-between text-left"
            onClick={() => setZonesExpanded((p) => !p)}
          >
            <CardHeader title="Split into Power Zones (Optional)" subtitle="For multi-stage events or distributed sites" />
            {zonesExpanded ? <ChevronDown size={18} className="text-text-muted mr-2 shrink-0" /> : <ChevronRight size={18} className="text-text-muted mr-2 shrink-0" />}
          </button>

          {zonesExpanded && (
            <div className="mt-3 space-y-3">
              <div className="flex items-start gap-2 px-3 py-2 bg-info/10 border border-info/30 rounded-lg text-sm text-info">
                <Info size={14} className="mt-0.5 shrink-0" />
                For multi-stage events or distributed sites, split the total load into independent zones for per-zone sizing.
              </div>

              {zones.map((z) => (
                <div key={z.id} className="bg-sg-800 rounded-lg p-3">
                  <div className="grid grid-cols-3 gap-3 items-end">
                    <InputField label="Zone Name" type="text" value={z.name} onChange={(v) => updateZone(z.id, 'name', v)} />
                    <InputField label="Load" unit="kW" value={z.kw} onChange={(v) => updateZone(z.id, 'kw', v)} min={0} />
                    <button onClick={() => removeZone(z.id)} className="text-text-dim hover:text-error mb-2">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              <Button size="sm" variant="secondary" onClick={addZone}><Plus size={14} /> Add Zone</Button>

              {zones.length > 0 && (() => {
                const zonesTotal = zones.reduce((s, z) => s + z.kw, 0)
                const diff = Math.abs(zonesTotal - inputs.peakLoadKw)
                return (
                  <div className={`text-sm px-3 py-2 rounded-lg border ${diff > 1 ? 'bg-warning/10 border-warning/30 text-warning' : 'bg-signal-blue/10 border-signal-blue/30 text-signal-blue'}`}>
                    Zones total: {fmtInt(zonesTotal)} kW vs Peak Load: {fmtInt(inputs.peakLoadKw)} kW
                    {diff > 1 && <span className="ml-2 font-medium">(difference: {fmtInt(diff)} kW)</span>}
                  </div>
                )
              })()}
            </div>
          )}
        </Card>
      )}

      {results && inputs.peakLoadKw > 0 && (
        <>
          {/* Step 2: System Configuration */}
          <Card>
            <CardHeader title="System Configuration" subtitle="Optimal BESS + Generator mix" />
            <ResultGrid>
              <ResultItem label="BESS Units (Continuous)" value={`${results.bessUnits} × ${results.bessUnitContinuousKw} kW`} highlight />
              <ResultItem label="Continuous-Power Minimum" value={`${results.bessUnitsForPeak} unit(s)`} />
              <ResultItem label="Recharge Input per BESS" value={`${fmt(results.bessUnitChargeKw, 1)} kW (${results.bessChargeBasis === 'published' ? 'published' : 'planning assumption — verify'})`} highlight={results.bessChargeBasis !== 'published'} />
              <ResultItem label="Usable Energy per 80%→30% Cycle" value={fmtInt(results.bessEnergyKwh)} unit="kWh" />
              <ResultItem label="Installed Generator Capacity" value={fmtInt(results.genCapacityKw)} unit="kW" />
              <ResultItem label="Generator Units" value={`${results.genUnits} × ${results.genUnitSizeKw} kW (${results.generatorRequiredUnits} duty + ${results.generatorStandbyUnits} standby)`} />
              <ResultItem label="Total System Capacity" value={fmtInt(results.totalCapacityKw)} unit="kW" highlight />
              <ResultItem label="Firm Generator Capacity" value={fmtInt(results.generatorFirmCapacityKw)} unit="kW" />
              <ResultItem label={`Peak Amps/Phase (3Φ ${siteVoltage}V)`} value={fmt(results.peakAmpsPerPhase, 0)} unit="A" highlight={results.parallelRunsNeeded} />
              <ResultItem label={`Base Amps/Phase (3Φ ${siteVoltage}V)`} value={fmt(results.baseAmpsPerPhase, 0)} unit="A" />
            </ResultGrid>

            {benchmarkReview && (
              <div className={`mt-4 rounded-lg border p-4 ${benchmarkReview.architectureStatus === 'resilient' ? 'border-signal-blue/35 bg-signal-blue/10' : 'border-warning/35 bg-warning/10'}`}>
                <div className="flex items-start gap-2">
                  {benchmarkReview.architectureStatus === 'resilient'
                    ? <Info size={16} className="mt-0.5 shrink-0 text-signal-blue" />
                    : <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" />}
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-text">Benchmark architecture check</h3>
                    <p className="mt-1 text-sm text-text">{benchmarkReview.architectureLabel}</p>
                    <p className="mt-1 text-xs text-text-muted">{benchmarkReview.loadBasisLabel}</p>
                    <ul className="mt-3 space-y-1 text-xs leading-relaxed text-text-muted">
                      {benchmarkReview.checks.map((check) => <li key={check}>• {check}</li>)}
                    </ul>
                    {benchmarkReview.warnings.map((warning) => (
                      <p key={warning} className="mt-2 text-xs font-semibold leading-relaxed text-warning">RED FLAG: {warning}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {results.parallelRunsNeeded && (
              <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span><strong>{fmt(results.peakAmpsPerPhase, 0)}A per phase — {Math.ceil(results.peakAmpsPerPhase / 400)} legs per phase required</strong> (generator power cable rated 400A per leg).</span>
              </div>
            )}

            <ChartFrame className="mt-4" height={80}>
              <BarChart data={capacityBarData} layout="vertical" barSize={30}>
                  <XAxis type="number" tick={{ fill: '#C5C6C7', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#C5C6C7', fontSize: 11 }} width={60} />
                  <Tooltip contentStyle={{ backgroundColor: '#1C2732', border: '1px solid #34495E', borderRadius: 8, color: '#F9FAFB' }} />
                  <Legend />
                  <Bar dataKey="base" name="Gen (Base)" stackId="a" fill="#ABE1FA" />
                  <Bar dataKey="peak" name="BESS (Peak)" stackId="a" fill="#C27A2C" />
                  <Bar dataKey="reserve" name="Redundancy" stackId="a" fill="#5B6673" />
                </BarChart>
            </ChartFrame>
          </Card>

          <Card>
            <CardHeader
              title="24/7 Hybrid Coverage Scenarios"
              subtitle="Battery-first EMaaS operation with generator dispatch, recharge reserve, and fallback coverage"
            />
            <ResultGrid>
              <ResultItem label="Installed BESS" value={fmtInt(results.coverage.bessInstalledKw)} unit="kW" highlight />
              <ResultItem label="BESS Energy" value={fmtInt(results.coverage.bessInstalledKwh)} unit="kWh" />
              <ResultItem label="Usable Energy" value={fmtInt(results.coverage.bessUsableKwh)} unit="kWh" />
              <ResultItem label="Generator Online" value={fmtInt(results.coverage.generatorOnlineKw)} unit="kW" highlight={results.coverage.canCarryPeakOnGenerator} />
              <ResultItem label="Recharge Reserve" value={fmtInt(results.coverage.generatorRechargeReserveKw)} unit="kW" highlight={results.coverage.canCarryBaseWhileCharging} />
              <ResultItem
                label="Modeled Battery Runtime"
                value={fmt(results.batteryRuntimeHoursPerCycle, 1)}
                unit="hrs"
                highlight={results.batteryRuntimeHoursPerCycle >= 1}
              />
              <ResultItem label="Generator Recharge Window" value={fmt(results.generatorRuntimeHoursPerCycle, 1)} unit="hrs" />
              <ResultItem label="Estimated Generator Runtime" value={fmt(results.generatorRuntimeHoursPerDay, 1)} unit="hrs/day" highlight />
            </ResultGrid>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {results.coverage.scenarios.map((scenario) => (
                <div key={scenario.label} className="rounded-lg border border-sg-600/40 bg-sg-800/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-sm font-bold text-text">{scenario.label}</h3>
                    <span className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${coverageStatusClass[scenario.status]}`}>
                      {coverageStatusLabel[scenario.status]}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-text-muted">{scenario.dispatch}</p>
                  <p className="mt-2 text-xs leading-relaxed text-text">{scenario.coverage}</p>
                  <p className="mt-2 text-xs leading-relaxed text-text-dim">{scenario.requirement}</p>
                </div>
              ))}
            </div>

            {results.coverage.estimatedRechargeHours !== null && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span>
                  Estimated 30%-to-80% fast-charge window is {fmt(results.coverage.estimatedRechargeHours, 1)} hours at {fmtInt(results.rechargePowerKw)} kW while the generator carries the load. Final dispatch needs field verification of charge limits, cable size, ATS/paralleling controls, and the equipment manufacturer's SOC settings.
                </span>
              </div>
            )}
          </Card>

          {oneLineDiagram && <OneLineDiagramPanel diagram={oneLineDiagram} />}

          {projectPlan && (
            <Card>
              <CardHeader title="Source + Branch Cable Schedule" subtitle="50-ft planning pieces; final gauge, ampacity, voltage drop, connector, neutral, and grounding decisions require technical review." />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-sg-600">
                    <th className="py-2 text-left text-text-muted">Circuit</th><th className="py-2 text-right text-text-muted">Load</th><th className="py-2 text-right text-text-muted">A/phase</th><th className="py-2 text-right text-text-muted">Runs/phase</th><th className="py-2 text-right text-text-muted">50-ft pieces</th>
                  </tr></thead>
                  <tbody>{projectPlan.cableSchedule.map((row) => (
                    <tr key={row.id} className="border-b border-sg-700">
                      <td className="py-2 text-text"><span className="font-bold">{row.id}</span> · {row.circuit}<span className="block text-xs text-text-dim">{row.voltage} V · neutral {row.neutral.replace('_', ' ')}</span></td>
                      <td className="text-right text-text">{fmtInt(row.loadKw)} kW</td><td className="text-right text-text">{fmt(row.ampsPerPhase, 0)}</td><td className="text-right text-text">{row.runsPerPhase}</td><td className="text-right font-bold text-accent-300">{row.pieces ?? `${row.pieceRange?.[0]}-${row.pieceRange?.[1]}`}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <p className="mt-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs leading-relaxed text-warning">{projectPlan.neutralExplanation}</p>
            </Card>
          )}

          {projectPlan && <Card><HybridSiteLayout3D plan={projectPlan} /><div className="mt-4 flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={syncToSiteFit} disabled={!zonesBalanced} className="disabled:cursor-not-allowed disabled:opacity-50">Open Synced Site Fit</Button></div></Card>}

          {projectPlan && (
            <Card>
              <CardHeader title="Budgetary Estimate Basis" subtitle="Calculated from the rates entered above; zero-rate lines identify required vendor selections, not free equipment." />
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-sg-600"><th className="py-2 text-left text-text-muted">Item</th><th className="py-2 text-right text-text-muted">Qty</th><th className="py-2 text-right text-text-muted">Billing periods</th><th className="py-2 text-right text-text-muted">Rate</th><th className="py-2 text-right text-text-muted">Extended</th><th className="py-2 text-right text-text-muted">Status</th></tr></thead><tbody>
                {projectPlan.quoteItems.map((item) => <tr key={item.id} className="border-b border-sg-700"><td className="py-2 text-text">{item.description}<span className="block text-xs text-text-dim">{item.modelSku}</span></td><td className="text-right text-text">{fmt(item.quantity, item.quantity < 10 ? 1 : 0)}</td><td className="text-right text-text">{fmt(item.periods, item.periods < 10 ? 2 : 0)}</td><td className="text-right text-text">{item.rate > 0 ? `${formatQuoteRate(item.rate, item.rateUnit)}/${item.rateUnit}` : 'TBD'}</td><td className="text-right font-bold text-text">{item.total > 0 ? fmtCurrency(item.total) : 'TBD'}</td><td className="text-right text-xs text-text-dim">{item.confirmation === 'entered_rate' ? 'Entered rate' : 'Vendor required'}</td></tr>)}
              </tbody></table></div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent-500/35 bg-accent-500/10 p-4"><div><div className="text-xs font-bold uppercase tracking-wider text-accent-300">Known-rate subtotal</div><div className="mt-1 text-2xl font-bold text-text">{fmtCurrency(projectPlan.budgetaryTotal)}</div><p className="mt-1 text-xs text-text-muted">Excludes every TBD distribution, logistics, labor, tax, and vendor-confirmation line.</p></div><Button type="button" onClick={addPackageToEstimate} disabled={!zonesBalanced} className="disabled:cursor-not-allowed disabled:opacity-50">Add Package to Estimate</Button></div>
            </Card>
          )}

          {/* Motor Assignments */}
          {results.motorAssignments.length > 0 && (
            <Card>
              <CardHeader title="Motor / Compressor Notes" subtitle="Informational handoff only; continuous power governs this estimate" />
              <div className="space-y-2">
                {results.motorAssignments.map((ma) => (
                  <div
                    key={ma.id}
                    className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm"
                  >
                    <div>
                      <span className="font-medium text-text">{ma.hp} HP — {ma.method.toUpperCase()}</span>
                      <span className="text-text-muted ml-2">Estimated LRA: {fmt(ma.lra, 0)}A</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} className="text-warning" /><span className="font-medium text-warning">Source review required</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Step 4: Financial Comparison */}
          <Card>
            <CardHeader title="Financial Comparison" subtitle="All-generator vs Hybrid (BESS + Generator)" />

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sg-600">
                    <th className="text-left py-2 text-text-muted">Metric</th>
                    <th className="text-right py-2 text-text-muted">All Generator</th>
                    <th className="text-right py-2 text-accent-400">Hybrid (Gen + BESS)</th>
                    <th className="text-right py-2 text-signal-blue">Difference vs All-Gen</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-sg-700">
                    <td className="py-2 text-text"><Fuel size={14} className="inline mr-1" />Daily Fuel</td>
                    <td className="text-right text-text">{fmtInt(results.allGenFuelPerDay)} gal</td>
                    <td className="text-right text-accent-300">{fmtInt(results.hybridFuelPerDay)} gal</td>
                    <td className="text-right text-signal-blue">{fmtInt(Math.abs(results.dailyFuelReduction))} gal/day {results.dailyFuelReduction >= 0 ? 'lower' : 'higher'}</td>
                  </tr>
                  <tr className="border-b border-sg-700">
                    <td className="py-2 text-text"><Fuel size={14} className="inline mr-1" />{inputs.projectDurationDays}-Day Fuel</td>
                    <td className="text-right text-text">{fmtInt(results.allGenFuelProject)} gal</td>
                    <td className="text-right text-accent-300">{fmtInt(results.hybridFuelTotal)} gal</td>
                    <td className="text-right text-signal-blue">{fmtInt(Math.abs(results.totalFuelReductionGal))} gal {results.totalFuelReductionGal >= 0 ? 'reduction' : 'increase'}</td>
                  </tr>
                  <tr className="border-b border-sg-700">
                    <td className="py-2 text-text"><DollarSign size={14} className="inline mr-1" />{inputs.projectDurationDays}-Day Total Cost</td>
                    <td className="text-right text-text">{fmtCurrency(results.allGenCostProject)}</td>
                    <td className="text-right text-accent-300">{fmtCurrency(results.hybridCostProject)}</td>
                    <td className="text-right text-signal-blue font-semibold">{fmtCurrency(Math.abs(results.costDifferenceProject))} {results.costDifferenceProject >= 0 ? 'lower' : 'higher'}</td>
                  </tr>
                  <tr className="border-b border-sg-700">
                    <td className="py-2 text-text font-semibold">Project Fuel Difference</td>
                    <td className="text-right">—</td>
                    <td className="text-right text-accent-300">{fmtInt(Math.abs(results.totalFuelReductionGal))} gal {results.totalFuelReductionGal >= 0 ? 'reduction' : 'increase'}</td>
                    <td className="text-right text-signal-blue font-semibold">{fmtCurrency(Math.abs(results.totalFuelCostDifferenceDollars))} fuel cost {results.totalFuelCostDifferenceDollars >= 0 ? 'reduction' : 'increase'}</td>
                  </tr>
                  <tr className="border-b border-sg-700">
                    <td className="py-2 text-text"><Leaf size={14} className="inline mr-1 text-signal-blue" />CO2 Difference</td>
                    <td className="text-right">—</td>
                    <td className="text-right text-signal-blue">{fmtInt(Math.abs(results.co2AvoidedLbs))} lbs {results.co2AvoidedLbs >= 0 ? 'lower' : 'higher'}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td className="py-2 text-text"><Leaf size={14} className="inline mr-1 text-signal-blue" />CO2 Difference</td>
                    <td className="text-right">—</td>
                    <td className="text-right text-signal-blue font-semibold">{fmt(Math.abs(results.co2AvoidedTons), 1)} tons {results.co2AvoidedTons >= 0 ? 'lower' : 'higher'}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Fuel Comparison</h4>
                <ChartFrame height={250}>
                  <BarChart data={fuelComparisonData} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#34495E" />
                    <XAxis dataKey="metric" tick={{ fill: '#C5C6C7', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#C5C6C7', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1C2732', border: '1px solid #34495E', borderRadius: 8, color: '#F9FAFB' }} />
                    <Legend />
                    <Bar dataKey="allGen" name="All Generator" fill="#D88A34" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="hybrid" name="Hybrid" fill="#ABE1FA" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartFrame>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Cumulative Fuel Difference</h4>
                <ChartFrame height={250}>
                  <AreaChart data={cumulativeReductionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#34495E" />
                    <XAxis dataKey="date" tick={{ fill: '#C5C6C7', fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#C5C6C7', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1C2732', border: '1px solid #34495E', borderRadius: 8, color: '#F9FAFB' }} />
                    <Area type="monotone" dataKey="cumulativeReductionGal" name="Cumulative fuel reduction (gal)" stroke="#C27A2C" fill="#C27A2C" fillOpacity={0.2} />
                  </AreaChart>
                </ChartFrame>
              </div>
            </div>
          </Card>

          {/* Distribution Reminders */}
          <Card>
            <CardHeader title="Electrical Distribution Reminders" />
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2 px-3 py-2 bg-info/10 border border-info/30 rounded-lg text-info">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span>
                  {siteVoltage === loadVoltage
                    ? `Source and load voltage are both ${siteVoltage} V; no step-down transformer is shown in this planning package.`
                    : `The planning package includes transformation from ${siteVoltage} V to ${loadVoltage} V. Confirm the delivered transformer, grounding, and protection with the engineer and vendor.`}
                </span>
              </div>
              <div className="flex items-start gap-2 px-3 py-2 bg-warning/10 border border-warning/30 rounded-lg text-warning">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>N+1/2N redundancy requires Automatic Transfer Switch(es) — include in your equipment order.</span>
              </div>
              <div className="flex items-start gap-2 px-3 py-2 bg-info/10 border border-info/30 rounded-lg text-info">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span>Cable sizing depends on distance. Voltage drop over long runs may require upsizing wire gauge — consult NEC tables.</span>
              </div>
            </div>
          </Card>

          {/* Per-Zone Breakdown */}
          {zones.length > 0 && (
            <Card>
              <CardHeader title="Power Zone Breakdown" subtitle={`Per-zone distribution planning (${loadVoltage}V 3-phase)`} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sg-600">
                      <th className="text-left py-2 text-text-muted">Zone Name</th>
                      <th className="text-right py-2 text-text-muted">kW</th>
                      <th className="text-right py-2 text-text-muted">Amps/Phase ({loadVoltage}V)</th>
                      <th className="text-right py-2 text-text-muted">Legs/Phase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zones.map((z) => {
                      const ampsPerPhase = (z.kw * 1000) / (SQRT3 * (inputs.loadVoltage ?? inputs.siteVoltage) * (inputs.powerFactor ?? 0.8))
                      const legs = Math.ceil(ampsPerPhase / 400)
                      return (
                        <tr key={z.id} className="border-b border-sg-700">
                          <td className="py-2 text-text">{z.name}</td>
                          <td className="text-right text-text">{fmtInt(z.kw)}</td>
                          <td className="text-right text-text">{fmt(ampsPerPhase, 0)}</td>
                          <td className="text-right text-text">{legs}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <div className="text-center text-xs text-text-dim py-2">
            These are estimates for reference only. Final system design must be verified by a licensed professional engineer.
          </div>
        </>
      )}
    </div>
  )
}
