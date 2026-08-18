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
import { EquipmentRecommendationPanel } from '../../components/ui/EquipmentRecommendationPanel'
import { SpecSummaryPanel, type SpecSummaryTone } from '../../components/ui/SpecSummaryPanel'
import { HybridEnergyPdfDoc } from './HybridEnergyPdf'
import { useCalculator } from '../../hooks/useCalculator'
import { calculateHybridWizard, type HybridWizardInputs, type MotorEntry, type BessUnitSize } from './scenario.formulas'
import { buildHybridOneLineDiagram } from './oneLineDiagram'
import { BESS_UNIT_SIZES, RATE_PERIOD_OPTIONS, VOLTAGE_OPTIONS, type RatePeriod, SQRT3 } from '../../lib/constants'
import { BESS_FLEET, normalizeRateToDaily, recommendEquipment, type EquipmentRecommendation } from '../../lib/equipmentRecommendations'
import { fmt, fmtInt, fmtCurrency } from '../../lib/formatters'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, AreaChart, Area,
} from 'recharts'
import { Plus, Trash2, AlertCircle, AlertTriangle, Info, Shield, Fuel, DollarSign, Leaf, ChevronDown, ChevronRight } from 'lucide-react'

let nextMotorId = 1

const coverageStatusLabel = {
  '24_7_ready': '24/7 ready',
  conditional: 'Conditional',
  not_feasible: 'Not feasible',
} as const

const coverageStatusClass = {
  '24_7_ready': 'border-success/35 bg-success/10 text-success',
  conditional: 'border-warning/35 bg-warning/10 text-warning',
  not_feasible: 'border-error/35 bg-error/10 text-error',
} as const

function preferredOption(recommendation: EquipmentRecommendation) {
  return recommendation[recommendation.preferred]
}

export default function HybridEnergyWizard() {
  const [peakLoadKw, setPeakLoadKw] = useState('800')
  const [baseLoadKw, setBaseLoadKw] = useState('400')
  const [loadSource, setLoadSource] = useState<'panel' | 'measured'>('measured')
  const [bessUnitSize, setBessUnitSize] = useState<string>('300')
  const [peakHoursPerDay, setPeakHoursPerDay] = useState('8')
  const [projectDays, setProjectDays] = useState('30')
  const [redundancy, setRedundancy] = useState('n1')
  const [siteVoltage, setSiteVoltage] = useState('480')
  const [altitude, setAltitude] = useState('0')
  const [ambientTemp, setAmbientTemp] = useState('85')
  const [fuelCost, setFuelCost] = useState('4.50')
  const [bessRental, setBessRental] = useState('350')
  const [bessRatePeriod, setBessRatePeriod] = useState<RatePeriod>('daily')
  const [genRental, setGenRental] = useState('500')
  const [genRatePeriod, setGenRatePeriod] = useState<RatePeriod>('daily')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [motors, setMotors] = useState<MotorEntry[]>([])
  const [zones, setZones] = useState<{id: string, name: string, kw: number}[]>([])
  const [zonesExpanded, setZonesExpanded] = useState(false)
  const [clientName, setClientName] = useState('')
  const [projectName, setProjectName] = useState('')

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

  const inputs: HybridWizardInputs = {
    peakLoadKw: parseFloat(peakLoadKw) || 0,
    baseLoadKw: parseFloat(baseLoadKw) || 0,
    loadSource,
    bessUnitSize: parseInt(bessUnitSize) as BessUnitSize,
    peakHoursPerDay: parseFloat(peakHoursPerDay) || 8,
    projectDurationDays: parseFloat(projectDays) || 30,
    redundancy: redundancy as 'field_verify' | 'n' | 'n1' | '2n',
    siteVoltage: parseInt(siteVoltage) || 480,
    altitude: parseFloat(altitude) || 0,
    ambientTemp: parseFloat(ambientTemp) || 85,
    fuelCostPerGallon: parseFloat(fuelCost) || 4.5,
    bessRentalPerDay: normalizeRateToDaily(parseFloat(bessRental) || 350, bessRatePeriod),
    genRentalPerDay: normalizeRateToDaily(parseFloat(genRental) || 500, genRatePeriod),
    startDate,
    endDate,
    motors,
  }

  const calculate = useCallback((inp: HybridWizardInputs) => {
    // Inverted or negative loads produce nonsense (negative "savings", BESS sized beyond peak)
    if (inp.baseLoadKw < 0 || inp.baseLoadKw > inp.peakLoadKw) return null
    return calculateHybridWizard(inp)
  }, [])
  const results = useCalculator(inputs, calculate)
  const oneLineDiagram = results ? buildHybridOneLineDiagram(inputs, results, zones) : null
  const recommendation = results
    ? recommendEquipment({
        peakKw: inputs.peakLoadKw,
        baseKw: inputs.baseLoadKw,
        runtimeHours: inputs.peakHoursPerDay,
        projectDurationHours: inputs.projectDurationDays * 24,
        peakHoursPerDay: inputs.peakHoursPerDay,
        preferredBessKw: inputs.bessUnitSize,
        redundancyFactor: results.redundancyFactor,
        siteVoltage: inputs.siteVoltage,
      })
    : null

  const fuelComparisonData = useMemo(() => {
    if (!results) return []
    return [
      { metric: 'Daily Fuel (gal)', allGen: Math.round(results.allGenFuelPerDay), hybrid: Math.round(results.hybridFuelPerDay) },
      { metric: '30-Day Fuel (gal)', allGen: Math.round(results.allGenFuel30Day), hybrid: Math.round(results.hybridFuelTotal > 0 ? results.hybridFuelPerDay * 30 : 0) },
    ]
  }, [results])

  const cumulativeSavingsData = useMemo(() => {
    if (!results) return []
    return results.dailyFuelData.filter((_, i) => i % Math.max(1, Math.floor(results.dailyFuelData.length / 60)) === 0 || i === results.dailyFuelData.length - 1)
  }, [results])

  const capacityBarData = useMemo(() => {
    if (!results) return []
    return [
      { name: 'System', base: results.genCapacityKw, peak: results.bessUnits * inputs.bessUnitSize, reserve: Math.max(0, results.totalCapacityKw - results.genCapacityKw - results.bessUnits * inputs.bessUnitSize) },
    ]
  }, [results, inputs.bessUnitSize])

  const hybridSpecSummary = results && recommendation
    ? (() => {
        const primaryScenario = results.coverage.scenarios[0]
        const fallbackScenario = results.coverage.scenarios.find((scenario) => scenario.label.includes('Generator-backed'))
        const recommended = preferredOption(recommendation)
        const cableLegs = Math.max(1, Math.ceil(results.peakAmpsPerPhase / 400))
        const rechargeWindow = results.coverage.estimatedRechargeHours === null
          ? 'No reserve'
          : `${fmt(results.coverage.estimatedRechargeHours, 1)} hrs`
        const statusTone: SpecSummaryTone = primaryScenario.status === '24_7_ready'
          ? fallbackScenario?.status === '24_7_ready' ? 'success' : 'info'
          : primaryScenario.status === 'conditional' ? 'warning' : 'warning'
        const statusLabel = primaryScenario.status === '24_7_ready'
          ? fallbackScenario?.status === '24_7_ready' ? 'Full 24/7 fallback ready' : '24/7 hybrid ready'
          : primaryScenario.status === 'conditional' ? 'Conditional hybrid coverage' : 'Needs redesign'

        return {
          statusLabel,
          statusTone,
          metrics: [
            {
              label: 'Recommended Package',
              value: recommended.units,
              detail: `${recommended.label} using Sunbelt-style fleet classes`,
            },
            {
              label: 'Load Profile',
              value: `${fmtInt(inputs.peakLoadKw)} / ${fmtInt(inputs.baseLoadKw)} kW`,
              detail: 'Peak / base demand',
            },
            {
              label: 'Installed Capacity',
              value: `${results.bessUnits} BESS + ${results.genUnits} gen`,
              detail: `${fmtInt(results.coverage.bessInstalledKw)} kW BESS, ${fmtInt(results.coverage.generatorOnlineKw)} kW generator`,
            },
            {
              label: 'Footprint',
              value: `~${fmtInt(recommended.footprintSqFt)} sq ft`,
              detail: 'Planning space before clearances and fuel logistics',
            },
            {
              label: 'Distribution',
              value: `${inputs.siteVoltage} V, ${cableLegs} leg${cableLegs === 1 ? '' : 's'}/phase`,
              detail: `${fmt(results.peakAmpsPerPhase, 0)} A/phase at peak`,
            },
            {
              label: 'Recharge Reserve',
              value: `${fmtInt(results.coverage.generatorRechargeReserveKw)} kW`,
              detail: `Estimated recharge window: ${rechargeWindow}`,
            },
            {
              label: 'Quiet Runtime',
              value: `${fmt(results.coverage.baseBatteryHours, 1)} hrs`,
              detail: 'Usable BESS at base load before recharge',
            },
            {
              label: 'Fuel Signal',
              value: `${fmtInt(results.dailyFuelReduction)} gal/day`,
              detail: `${fmtCurrency(results.totalFuelSavingsDollars)} estimated project fuel cost reduction`,
            },
          ],
          steps: [
            {
              label: 'BESS serves load',
              detail: 'Battery/PCS carries quiet runtime and absorbs peak swings while SOC stays above threshold.',
            },
            {
              label: 'EMS starts gen',
              detail: 'Remote start fires the generator when SOC, load, or reserve threshold requires recharge.',
            },
            {
              label: 'Generator carries load',
              detail: 'Generator supports the customer load and leaves reserve for BESS recharge where capacity allows.',
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Step 1: Requirements */}
      <Card>
        <CardHeader title="Hybrid EMaaS Strategy - BESS + Generator" subtitle="Design redundant systems for construction, commissioning, and mission-critical loads" />

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
          {redundancy === 'field_verify' && (
            <div className="flex items-start gap-2 px-3 py-2 bg-info/10 border border-info/30 rounded-lg text-sm text-info">
              <Info size={14} className="mt-0.5 shrink-0" />
              Field verify uses N+1 planning capacity until the redundancy requirement is confirmed.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InputField label="Peak Hours/Day" unit="hrs" value={peakHoursPerDay} onChange={setPeakHoursPerDay} />
            <InputField label="Project Duration" unit="days" value={projectDays} onChange={setProjectDays} />
            <InputField label="Start Date" type="date" value={startDate} onChange={setStartDate} />
            <InputField label="End Date" type="date" value={endDate} onChange={setEndDate} tooltip="Or use duration" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InputField label="Altitude" unit="ft ASL" value={altitude} onChange={setAltitude} />
            <InputField label="Ambient Temperature" unit="°F" value={ambientTemp} onChange={setAmbientTemp} />
            <InputField label="Fuel Cost" unit="$/gal" value={fuelCost} onChange={setFuelCost} />
            <InputField label="BESS Rental" unit={`$/${bessRatePeriod}/unit`} value={bessRental} onChange={setBessRental} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SelectField
              label="BESS Rate Period"
              value={bessRatePeriod}
              onChange={(v) => setBessRatePeriod(v as RatePeriod)}
              options={RATE_PERIOD_OPTIONS.map((option) => ({ ...option }))}
            />
            <InputField label="Generator Rental" unit={`$/${genRatePeriod}/unit`} value={genRental} onChange={setGenRental} />
            <SelectField
              label="Generator Rate Period"
              value={genRatePeriod}
              onChange={(v) => setGenRatePeriod(v as RatePeriod)}
              options={RATE_PERIOD_OPTIONS.map((option) => ({ ...option }))}
            />
          </div>
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
          action={
            <PdfExportButton
              document={<HybridEnergyPdfDoc inputs={inputs} results={results} zones={zones} clientName={clientName} projectName={projectName} />}
              filename="emaas-hybrid-energy-report.pdf"
              label="Generate Report"
            />
          }
        />
      )}

      {/* Motor Loads */}
      <Card>
        <CardHeader
          title="Motor / Compressor Loads"
          subtitle="Add motors to check inrush compatibility with BESS"
          action={<Button size="sm" variant="secondary" onClick={addMotor}><Plus size={14} /> Add Motor</Button>}
        />
        {motors.length === 0 && (
          <p className="text-sm text-text-dim text-center py-3">No motor loads — BESS can handle all loads. Add motors if present.</p>
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
                    <InputField label="Zone Name" value={z.name} onChange={(v) => updateZone(z.id, 'name', v)} />
                    <InputField label="Load" unit="kW" value={z.kw} onChange={(v) => updateZone(z.id, 'kw', v)} />
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
                  <div className={`text-sm px-3 py-2 rounded-lg border ${diff > 1 ? 'bg-warning/10 border-warning/30 text-warning' : 'bg-success/10 border-success/30 text-success'}`}>
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
              <ResultItem label="BESS Units" value={`${results.bessUnits} × ${inputs.bessUnitSize} kW`} highlight />
              <ResultItem label="BESS Energy Needed" value={fmtInt(results.bessEnergyKwh)} unit="kWh" />
              <ResultItem label="Generator Capacity" value={fmtInt(results.genCapacityKw)} unit="kW" />
              <ResultItem label="Generator Units" value={`${results.genUnits} × ${results.genUnitSizeKw} kW`} />
              <ResultItem label="Total System Capacity" value={fmtInt(results.totalCapacityKw)} unit="kW" highlight />
              <ResultItem label="Redundancy Factor" value={`${results.redundancyFactor}x`} />
              <ResultItem label={`Peak Amps/Phase (3Φ ${siteVoltage}V)`} value={fmt(results.peakAmpsPerPhase, 0)} unit="A" highlight={results.parallelRunsNeeded} />
              <ResultItem label={`Base Amps/Phase (3Φ ${siteVoltage}V)`} value={fmt(results.baseAmpsPerPhase, 0)} unit="A" />
            </ResultGrid>

            {results.parallelRunsNeeded && (
              <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span><strong>{fmt(results.peakAmpsPerPhase, 0)}A per phase — {Math.ceil(results.peakAmpsPerPhase / 400)} legs per phase required</strong> (generator power cable rated 400A per leg).</span>
              </div>
            )}

            <ChartFrame className="mt-4" height={80}>
              <BarChart data={capacityBarData} layout="vertical" barSize={30}>
                  <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} width={60} />
                  <Tooltip contentStyle={{ backgroundColor: '#242a38', border: '1px solid #2d3548', borderRadius: 8, color: '#f1f5f9' }} />
                  <Legend />
                  <Bar dataKey="base" name="Gen (Base)" stackId="a" fill="#38bdf8" />
                  <Bar dataKey="peak" name="BESS (Peak)" stackId="a" fill="#c89a3c" />
                  <Bar dataKey="reserve" name="Redundancy" stackId="a" fill="#6b7280" />
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
                label="Base Battery Runtime"
                value={fmt(results.coverage.baseBatteryHours, 1)}
                unit="hrs"
                highlight={results.coverage.baseBatteryHours >= 8}
              />
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
                  Estimated full recharge window is {fmt(results.coverage.estimatedRechargeHours, 1)} hours using available generator reserve. Final dispatch needs field verification of SOC thresholds, charge limits, cable size, and controls.
                </span>
              </div>
            )}
          </Card>

          {recommendation && <EquipmentRecommendationPanel recommendation={recommendation} />}

          {oneLineDiagram && <OneLineDiagramPanel diagram={oneLineDiagram} />}

          {/* Motor Assignments */}
          {results.motorAssignments.length > 0 && (
            <Card>
              <CardHeader title="Motor Inrush Analysis" subtitle="Auto-assignment based on locked rotor amps vs BESS inverter limits" />
              <div className="space-y-2">
                {results.motorAssignments.map((ma) => (
                  <div
                    key={ma.id}
                    className={`flex items-center justify-between p-3 rounded-lg text-sm ${
                      ma.assignment === 'generator' ? 'bg-error/10 border border-error/30' : 'bg-success/10 border border-success/30'
                    }`}
                  >
                    <div>
                      <span className="font-medium text-text">{ma.hp} HP — {ma.method.toUpperCase()}</span>
                      <span className="text-text-muted ml-2">LRA: {fmt(ma.lra, 0)}A</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {ma.assignment === 'generator' ? (
                        <><AlertCircle size={14} className="text-error" /><span className="text-error font-medium">Generator Circuit</span></>
                      ) : (
                        <><Shield size={14} className="text-success" /><span className="text-success font-medium">BESS Compatible</span></>
                      )}
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
                    <th className="text-right py-2 text-success">Cost Reduction</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-sg-700">
                    <td className="py-2 text-text"><Fuel size={14} className="inline mr-1" />Daily Fuel</td>
                    <td className="text-right text-text">{fmtInt(results.allGenFuelPerDay)} gal</td>
                    <td className="text-right text-accent-300">{fmtInt(results.hybridFuelPerDay)} gal</td>
                    <td className="text-right text-success">{fmtInt(results.dailyFuelReduction)} gal/day</td>
                  </tr>
                  <tr className="border-b border-sg-700">
                    <td className="py-2 text-text"><Fuel size={14} className="inline mr-1" />30-Day Fuel</td>
                    <td className="text-right text-text">{fmtInt(results.allGenFuel30Day)} gal</td>
                    <td className="text-right text-accent-300">{fmtInt(results.hybridFuelPerDay * 30)} gal</td>
                    <td className="text-right text-success">{fmtInt(results.dailyFuelReduction * 30)} gal</td>
                  </tr>
                  <tr className="border-b border-sg-700">
                    <td className="py-2 text-text"><DollarSign size={14} className="inline mr-1" />30-Day Total Cost</td>
                    <td className="text-right text-text">{fmtCurrency(results.allGenCost30Day)}</td>
                    <td className="text-right text-accent-300">{fmtCurrency(results.hybridCost30Day)}</td>
                    <td className="text-right text-success font-semibold">{fmtCurrency(results.costSavings30Day)}</td>
                  </tr>
                  <tr className="border-b border-sg-700">
                    <td className="py-2 text-text font-semibold">Estimated Fuel Cost Reduction</td>
                    <td className="text-right">—</td>
                    <td className="text-right text-accent-300">{fmtInt(results.totalFuelSavingsGal)} gal</td>
                    <td className="text-right text-success font-semibold">{fmtCurrency(results.totalFuelSavingsDollars)}</td>
                  </tr>
                  <tr className="border-b border-sg-700">
                    <td className="py-2 text-text"><Leaf size={14} className="inline mr-1 text-success" />CO2 Avoided</td>
                    <td className="text-right">—</td>
                    <td className="text-right text-success">{fmtInt(results.co2AvoidedLbs)} lbs</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td className="py-2 text-text"><Leaf size={14} className="inline mr-1 text-success" />CO2 Avoided</td>
                    <td className="text-right">—</td>
                    <td className="text-right text-success font-semibold">{fmt(results.co2AvoidedTons, 1)} tons</td>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" />
                    <XAxis dataKey="metric" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#242a38', border: '1px solid #2d3548', borderRadius: 8, color: '#f1f5f9' }} />
                    <Legend />
                    <Bar dataKey="allGen" name="All Generator" fill="#e07460" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="hybrid" name="Hybrid" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartFrame>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Cumulative Fuel Cost Reduction</h4>
                <ChartFrame height={250}>
                  <AreaChart data={cumulativeSavingsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" />
                    <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#242a38', border: '1px solid #2d3548', borderRadius: 8, color: '#f1f5f9' }} />
                    <Area type="monotone" dataKey="cumulativeSavingsGal" name="Cumulative Reduction (gal)" stroke="#c89a3c" fill="#c89a3c" fillOpacity={0.2} />
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
                <span>Your site needs step-down transformers for {siteVoltage}V→240V→120V distribution. Confirm with your electrician.</span>
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
              <CardHeader title="Power Zone Breakdown" subtitle={`Per-zone distribution planning (${siteVoltage}V 3-phase)`} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sg-600">
                      <th className="text-left py-2 text-text-muted">Zone Name</th>
                      <th className="text-right py-2 text-text-muted">kW</th>
                      <th className="text-right py-2 text-text-muted">Amps/Phase ({siteVoltage}V)</th>
                      <th className="text-right py-2 text-text-muted">Legs/Phase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zones.map((z) => {
                      const ampsPerPhase = (z.kw * 1000) / (SQRT3 * inputs.siteVoltage * 0.8)
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
