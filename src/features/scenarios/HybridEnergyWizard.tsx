import { useState, useCallback, useMemo } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { SelectField } from '../../components/ui/SelectField'
import { RadioGroup } from '../../components/ui/RadioGroup'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { Button } from '../../components/ui/Button'
import { PdfExportButton } from '../../components/pdf/PdfExportButton'
import { HybridEnergyPdfDoc } from './HybridEnergyPdf'
import { useCalculator } from '../../hooks/useCalculator'
import { calculateHybridWizard, type HybridWizardInputs, type MotorEntry, type BessUnitSize } from './scenario.formulas'
import { BESS_UNIT_SIZES } from '../../lib/constants'
import { fmt, fmtInt, fmtCurrency } from '../../lib/formatters'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts'
import { Plus, Trash2, AlertCircle, AlertTriangle, Info, Shield, Fuel, DollarSign } from 'lucide-react'

let nextMotorId = 1

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
  const [genRental, setGenRental] = useState('500')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [motors, setMotors] = useState<MotorEntry[]>([])

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
    redundancy: redundancy as 'n' | 'n1' | '2n',
    siteVoltage: parseInt(siteVoltage) || 480,
    altitude: parseFloat(altitude) || 0,
    ambientTemp: parseFloat(ambientTemp) || 85,
    fuelCostPerGallon: parseFloat(fuelCost) || 4.5,
    bessRentalPerDay: parseFloat(bessRental) || 350,
    genRentalPerDay: parseFloat(genRental) || 500,
    startDate,
    endDate,
    motors,
  }

  const calculate = useCallback((inp: HybridWizardInputs) => calculateHybridWizard(inp), [])
  const results = useCalculator(inputs, calculate)

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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Step 1: Requirements */}
      <Card>
        <CardHeader title="Hybrid Energy Management — BESS + Generator" subtitle="Design a redundant power system up to 2 MW" />

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Peak Load Demand" unit="kW" value={peakLoadKw} onChange={setPeakLoadKw} required tooltip="Maximum load the system must handle" max={2000} />
            <InputField label="Base/Continuous Load" unit="kW" value={baseLoadKw} onChange={setBaseLoadKw} required tooltip="Average continuous load — generators sized for this" />
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
              options={BESS_UNIT_SIZES.map((s) => ({ value: String(s), label: `${s} kW` }))}
              required
            />
            <SelectField
              label="Redundancy Level"
              value={redundancy}
              onChange={setRedundancy}
              options={[
                { value: 'n', label: 'N (no redundancy)' },
                { value: 'n1', label: 'N+1 (recommended)' },
                { value: '2n', label: '2N (full redundancy)' },
              ]}
            />
            <SelectField
              label="Site Voltage"
              value={siteVoltage}
              onChange={setSiteVoltage}
              options={[
                { value: '480', label: '480V' },
                { value: '4160', label: '4160V' },
              ]}
            />
          </div>

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
            <InputField label="BESS Rental" unit="$/day/unit" value={bessRental} onChange={setBessRental} />
          </div>

          <InputField label="Generator Rental" unit="$/day/unit" value={genRental} onChange={setGenRental} />
        </div>
      </Card>

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
            </ResultGrid>

            <div className="mt-4" style={{ height: 80 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capacityBarData} layout="vertical" barSize={30}>
                  <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} width={60} />
                  <Tooltip contentStyle={{ backgroundColor: '#242a38', border: '1px solid #2d3548', borderRadius: 8, color: '#f1f5f9' }} />
                  <Legend />
                  <Bar dataKey="base" name="Gen (Base)" stackId="a" fill="#22c55e" />
                  <Bar dataKey="peak" name="BESS (Peak)" stackId="a" fill="#c89a3c" />
                  <Bar dataKey="reserve" name="Redundancy" stackId="a" fill="#6b7280" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

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
                    <th className="text-right py-2 text-success">Savings</th>
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
                  <tr>
                    <td className="py-2 text-text font-semibold">Project Fuel Savings</td>
                    <td className="text-right">—</td>
                    <td className="text-right text-accent-300">{fmtInt(results.totalFuelSavingsGal)} gal</td>
                    <td className="text-right text-success font-semibold">{fmtCurrency(results.totalFuelSavingsDollars)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <div style={{ height: 250 }}>
                <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Fuel Comparison</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fuelComparisonData} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" />
                    <XAxis dataKey="metric" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#242a38', border: '1px solid #2d3548', borderRadius: 8, color: '#f1f5f9' }} />
                    <Legend />
                    <Bar dataKey="allGen" name="All Generator" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="hybrid" name="Hybrid" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ height: 250 }}>
                <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Cumulative Fuel Savings</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulativeSavingsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" />
                    <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#242a38', border: '1px solid #2d3548', borderRadius: 8, color: '#f1f5f9' }} />
                    <Area type="monotone" dataKey="cumulativeSavingsGal" name="Cumulative Savings (gal)" stroke="#c89a3c" fill="#c89a3c" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
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

          <div className="flex justify-center py-4">
            <PdfExportButton
              document={<HybridEnergyPdfDoc inputs={inputs} results={results} />}
              filename="hybrid-energy-report.pdf"
            />
          </div>

          <div className="text-center text-xs text-text-dim py-2">
            These are estimates for reference only. Final system design must be verified by a licensed professional engineer.
          </div>
        </>
      )}
    </div>
  )
}
