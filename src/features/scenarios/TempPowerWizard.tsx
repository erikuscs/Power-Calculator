import { useState, useCallback, useMemo } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { SelectField } from '../../components/ui/SelectField'
import { RadioGroup } from '../../components/ui/RadioGroup'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { PdfExportButton } from '../../components/pdf/PdfExportButton'
import { ReportContextFields } from '../../components/ui/ReportContextFields'
import { ChartFrame } from '../../components/ui/ChartFrame'
import { OneLineDiagramPanel } from '../../components/ui/OneLineDiagramPanel'
import { FieldRiskReviewPanel } from '../../components/ui/FieldRiskReviewPanel'
import { Button } from '../../components/ui/Button'
import { TempPowerPdfDoc } from './TempPowerPdf'
import { useCalculator } from '../../hooks/useCalculator'
import { calculateTempPower, type TempPowerInputs, type FacilityEntry } from './scenario.formulas'
import { buildTempPowerOneLineDiagram } from './oneLineDiagram'
import { buildFieldRiskReview, defaultTempPowerRiskInputs, type TempPowerRiskInputs } from './fieldRiskReview'
import { FACILITY_PRESETS, STRUCTURE_COOLING_MULTIPLIERS } from '../../lib/constants'
import { fmt, fmtInt, fmtPercent } from '../../lib/formatters'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { ClipboardList, Trash2, AlertTriangle, Info } from 'lucide-react'

let nextId = 1

export default function TempPowerWizard() {
  const [mode, setMode] = useState<'single' | 'basecamp'>('single')
  const [loadKw, setLoadKw] = useState('200')
  const [sqFt, setSqFt] = useState('2000')
  const [ambientTemp, setAmbientTemp] = useState('95')
  const [targetTemp, setTargetTemp] = useState('72')
  const [durationHours, setDurationHours] = useState('720')
  const [altitude, setAltitude] = useState('0')
  const [powerFactor, setPowerFactor] = useState('0.8')
  const [serviceIntervalDays, setServiceIntervalDays] = useState('10')
  const [technicianCoverage, setTechnicianCoverage] = useState<'none' | 'business_hours' | '24_7'>('business_hours')
  const [containmentRequired, setContainmentRequired] = useState(true)
  const [noiseFinePerDay, setNoiseFinePerDay] = useState('0')
  const [clientName, setClientName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [facilities, setFacilities] = useState<FacilityEntry[]>([])
  const [riskInputs, setRiskInputs] = useState<TempPowerRiskInputs>(defaultTempPowerRiskInputs)

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
    setDurationHours('23376')
    setAltitude('0')
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

  const inputs: TempPowerInputs = {
    mode,
    loadKw: parseFloat(loadKw) || 0,
    sqFt: parseFloat(sqFt) || 0,
    ambientTemp: parseFloat(ambientTemp) || 95,
    targetTemp: parseFloat(targetTemp) || 72,
    durationHours: parseFloat(durationHours) || 24,
    altitude: parseFloat(altitude) || 0,
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
  const fieldRiskReview = results
    ? buildFieldRiskReview({
        inputs: riskInputs,
        totalLoadKw: results.totalLoadKw,
        coolingKw: results.coolingKw,
        totalWithCoolingKw: results.totalWithCoolingKw,
        powerFactor: inputs.powerFactor,
      })
    : null

  const structureOptions = Object.entries(STRUCTURE_COOLING_MULTIPLIERS).map(([value, { label, multiplier }]) => ({
    value,
    label: `${label} (${multiplier}x)`,
  }))

  const facilityOptions = Object.entries(FACILITY_PRESETS).map(([value, { label, defaultKw, unit }]) => ({
    value,
    label: `${label} — ${defaultKw} kW ${unit}`,
  }))

  const fuelComparisonData = useMemo(() => {
    if (!results?.hybrid) return []
    return [
      { name: 'Daily Fuel (gal)', 'All Generator': Math.round(results.hybrid.allGen.fuelPerDay), 'Hybrid (Gen + BESS)': Math.round(results.hybrid.hybrid.fuelPerDay) },
      { name: '30-Day Fuel (gal)', 'All Generator': Math.round(results.hybrid.allGen.fuel30Day), 'Hybrid (Gen + BESS)': Math.round(results.hybrid.hybrid.fuel30Day) },
    ]
  }, [results])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader
          title="Temporary Power & Cooling"
          subtitle="EMaaS load capture, equipment planning, service cadence, and report generation"
          action={
            <Button type="button" variant="secondary" size="sm" onClick={loadTempHousingScenario}>
              <ClipboardList size={14} />
              Load Temp Housing Scenario
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

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mode === 'single' && (
            <>
              <InputField label="Equipment Load" unit="kW (real power)" value={loadKw} onChange={setLoadKw} required tooltip="Total electrical load — kW, not kVA" />
              <InputField label="Facility Size" unit="sq ft" value={sqFt} onChange={setSqFt} tooltip="Floor area for envelope heat gain" />
            </>
          )}
          <InputField label="Ambient Temperature" unit="°F" value={ambientTemp} onChange={setAmbientTemp} required />
          <InputField label="Target Temperature" unit="°F" value={targetTemp} onChange={setTargetTemp} required />
          <InputField label="Duration" unit="hours" value={durationHours} onChange={setDurationHours} required tooltip="720 hours = 30 days" />
          <InputField label="Altitude" unit="ft ASL" value={altitude} onChange={setAltitude} tooltip="+3% derating per 1,000 ft above 1,000 ft" />
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
                <div className="grid grid-cols-3 gap-3">
                  <InputField label="Qty" value={f.quantity} onChange={(v) => updateFacility(f.id, 'quantity', v)} />
                  <InputField label="kW/unit" value={f.kwPerUnit} onChange={(v) => updateFacility(f.id, 'kwPerUnit', v)} tooltip="Override if you know better" />
                  <SelectField label="Structure" value={f.structureType} onChange={(v) => updateFacility(f.id, 'structureType', v)} options={structureOptions} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {results && (results.totalLoadKw > 0) && (
        <>
          <Card>
            <CardHeader title="Equipment Sizing Results" subtitle="Safety margins applied — see values before margin in each card" />

            {mode === 'basecamp' && results.facilityBreakdown.length > 0 && (
              <div className="mb-4 bg-sg-800 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Facility Breakdown</h4>
                {results.facilityBreakdown.map((f, i) => (
                  <div key={i} className="flex justify-between text-sm py-0.5">
                    <span className="text-text-muted">{f.label}</span>
                    <span className="text-text font-medium">{fmt(f.kw, 1)} kW</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm pt-1 mt-1 border-t border-sg-600 font-semibold">
                  <span className="text-accent-400">Total Equipment Load</span>
                  <span className="text-accent-300">{fmt(results.totalLoadKw, 1)} kW</span>
                </div>
              </div>
            )}

            <ResultGrid>
              <ResultItem label="Total Equipment Load" value={fmt(results.totalLoadKw, 1)} unit="kW" />
              <ResultItem label="Cooling Tonnage" value={fmt(results.coolingTons, 1)} unit="tons" beforeMargin={fmt(results.coolingTons / 1.15, 1) + ' tons'} />
              <ResultItem label="Cooling Electrical Load" value={fmt(results.coolingKw, 1)} unit="kW" />
              <ResultItem label="Total Load (with cooling)" value={fmt(results.totalWithCoolingKw, 1)} unit="kW" />
              <ResultItem label="Generator Size" value={fmt(results.generatorKva, 0)} unit="kVA" highlight beforeMargin={fmt(results.generatorKva / 1.25, 0) + ' kVA'} />
              <ResultItem label="Generator Size" value={fmt(results.generatorKw, 0)} unit="kW" highlight beforeMargin={fmt(results.generatorKw / 1.25, 0) + ' kW'} />
              <ResultItem label="Amps per Phase (3Φ 480V)" value={fmt(results.ampsPerPhase, 0)} unit="A" highlight={results.parallelRunsNeeded} />
              <ResultItem label="Load Factor" value={fmtPercent(results.loadFactor)} />
              <ResultItem label="BSFC" value={fmt(results.bsfcGalPerKwh, 3)} unit="gal/kWh" />
              <ResultItem label="Fuel Rate" value={fmt(results.fuelGallonsPerHour, 1)} unit="gal/hr" />
              <ResultItem label="Total Fuel" value={fmtInt(results.totalFuelGallons)} unit="gallons" highlight beforeMargin={fmtInt(results.totalFuelGallons / 1.1) + ' gal'} />
              <ResultItem label="Operating Days" value={fmt(results.operatingDays, 1)} unit="days" />
              <ResultItem label="PM Service Events" value={fmtInt(results.serviceEvents)} unit="events" />
              <ResultItem label="Noise Fine Exposure" value={`$${fmtInt(results.noiseFineExposure)}`} highlight={results.noiseFineExposure > 0} />
            </ResultGrid>

            {results.parallelRunsNeeded && (
              <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span><strong>{fmt(results.ampsPerPhase, 0)}A per phase — {Math.ceil(results.ampsPerPhase / 400)} legs per phase required</strong> (generator power cable rated 400A per leg).</span>
              </div>
            )}

            {results.altitudeDerating > 1 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-warning">
                <AlertTriangle size={14} />
                Altitude derating applied: {fmtPercent(results.altitudeDerating - 1)} increase in fuel consumption at {fmtInt(parseFloat(altitude))} ft
              </div>
            )}

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-start gap-2 px-3 py-2 bg-info/10 border border-info/30 rounded-lg text-info">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span>Your site needs step-down transformers for 480V→240V→120V distribution. Confirm with your electrician.</span>
              </div>
              <div className="flex items-start gap-2 px-3 py-2 bg-info/10 border border-info/30 rounded-lg text-info">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span>Cable sizing depends on distance. Voltage drop over long runs may require upsizing wire gauge — consult NEC tables.</span>
              </div>
            </div>
          </Card>

          {fieldRiskReview && (
            <FieldRiskReviewPanel
              inputs={riskInputs}
              review={fieldRiskReview}
              onChange={updateRiskInput}
            />
          )}

          {oneLineDiagram && <OneLineDiagramPanel diagram={oneLineDiagram} />}

          {results.hybrid && (
            <Card>
              <CardHeader title="BESS + Generator Hybrid Recommendation" subtitle={results.hybrid.reason} />

              {results.hybrid.recommended && (
                <div className="mb-4 px-3 py-2 bg-success/10 border border-success/30 rounded-lg text-sm text-success font-medium">
                  Hybrid configuration recommended — {fmt(results.hybrid.hybrid.fuelSavingsPercent, 0)}% fuel savings over 30 days
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sg-600">
                      <th className="text-left py-2 text-text-muted font-medium">Metric</th>
                      <th className="text-right py-2 text-text-muted font-medium">All Generator</th>
                      <th className="text-right py-2 text-accent-400 font-medium">Hybrid (Gen + BESS)</th>
                    </tr>
                  </thead>
                  <tbody className="text-text">
                    <tr className="border-b border-sg-700">
                      <td className="py-2">Generator Units</td>
                      <td className="text-right">{results.hybrid.allGen.genUnits}</td>
                      <td className="text-right text-accent-300">{results.hybrid.hybrid.genUnits}</td>
                    </tr>
                    <tr className="border-b border-sg-700">
                      <td className="py-2">BESS Units</td>
                      <td className="text-right">0</td>
                      <td className="text-right text-accent-300">{results.hybrid.hybrid.bessUnits} × {results.hybrid.hybrid.bessUnitSize} kW</td>
                    </tr>
                    <tr className="border-b border-sg-700">
                      <td className="py-2">Generator Load Factor</td>
                      <td className="text-right">{fmtPercent(results.hybrid.allGen.loadFactor)}</td>
                      <td className="text-right text-accent-300">{fmtPercent(results.hybrid.hybrid.loadFactor)}</td>
                    </tr>
                    <tr className="border-b border-sg-700">
                      <td className="py-2">Daily Fuel</td>
                      <td className="text-right">{fmtInt(results.hybrid.allGen.fuelPerDay)} gal</td>
                      <td className="text-right text-accent-300">{fmtInt(results.hybrid.hybrid.fuelPerDay)} gal</td>
                    </tr>
                    <tr className="border-b border-sg-700">
                      <td className="py-2 font-medium">30-Day Fuel</td>
                      <td className="text-right font-medium">{fmtInt(results.hybrid.allGen.fuel30Day)} gal</td>
                      <td className="text-right font-medium text-success">{fmtInt(results.hybrid.hybrid.fuel30Day)} gal</td>
                    </tr>
                    <tr className="border-b border-sg-700">
                      <td className="py-2 font-semibold">Fuel Savings</td>
                      <td className="text-right">—</td>
                      <td className="text-right font-semibold text-success">{fmt(results.hybrid.hybrid.fuelSavingsPercent, 0)}%</td>
                    </tr>
                    <tr>
                      <td className="py-2">CO2 Avoided</td>
                      <td className="text-right">—</td>
                      <td className="text-right text-success">{fmtInt(results.co2AvoidedLbs)} lbs ({fmt(results.co2AvoidedTons, 1)} tons)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {fuelComparisonData.length > 0 && (
                <ChartFrame className="mt-4" height={250}>
                  <BarChart data={fuelComparisonData} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" />
                      <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#242a38', border: '1px solid #2d3548', borderRadius: 8, color: '#f1f5f9' }} />
                      <Legend />
                      <Bar dataKey="All Generator" fill="#e07460" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Hybrid (Gen + BESS)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartFrame>
              )}

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-start gap-2 px-3 py-2 bg-warning/10 border border-warning/30 rounded-lg text-warning">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>Redundancy requires Automatic Transfer Switch(es) — include in your equipment order.</span>
                </div>
              </div>
            </Card>
          )}

          <div className="flex justify-center py-4">
            <PdfExportButton
              document={<TempPowerPdfDoc inputs={inputs} results={results} riskReview={fieldRiskReview ?? undefined} clientName={clientName} projectName={projectName} />}
              filename="emaas-temp-power-report.pdf"
            />
          </div>

          <div className="text-center text-xs text-text-dim py-2">
            These are emergency estimates. Final sizing must be verified by a licensed engineer.
          </div>
        </>
      )}
    </div>
  )
}
