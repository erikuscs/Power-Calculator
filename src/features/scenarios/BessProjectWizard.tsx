import { useState, useCallback } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { SelectField } from '../../components/ui/SelectField'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { Button } from '../../components/ui/Button'
import { PdfExportButton } from '../../components/pdf/PdfExportButton'
import { BessProjectPdfDoc } from './BessProjectPdf'
import { useCalculator } from '../../hooks/useCalculator'
import {
  calculateSizing,
  describeSizing,
  calculateROI,
  describeROI,
  type SizingInputs,
  type ROIInputs,
} from '../bess/bess.formulas'
import { fmt, fmtInt, fmtCurrency } from '../../lib/formatters'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

export default function BessProjectWizard() {
  const [step, setStep] = useState(1)

  // Step 1 — System Requirements
  const [loadKW, setLoadKW] = useState('500')
  const [durationHours, setDurationHours] = useState('4')
  const [unitCapacity, setUnitCapacity] = useState('200')
  const [dodPercent, setDodPercent] = useState('80')
  const [lossesPercent, setLossesPercent] = useState('5')

  // Step 2 — Financial Parameters
  const [systemCost, setSystemCost] = useState('500000')
  const [peakRate, setPeakRate] = useState('0.25')
  const [offPeakRate, setOffPeakRate] = useState('0.08')
  const [roundTripEfficiency, setRoundTripEfficiency] = useState('0.85')
  const [cyclesPerDay, setCyclesPerDay] = useState('1')
  const [monthlyPeakReduction, setMonthlyPeakReduction] = useState('200')
  const [demandChargeRate, setDemandChargeRate] = useState('15')
  const [degradationRate, setDegradationRate] = useState('0.02')
  const [discountRate, setDiscountRate] = useState('0.08')
  const [analysisPeriod, setAnalysisPeriod] = useState('10')

  const sizingInputs: SizingInputs = {
    loadKW: parseFloat(loadKW) || 0,
    hours: parseFloat(durationHours) || 0,
    dodPercent: parseFloat(dodPercent) || 80,
    unitCapacity: parseFloat(unitCapacity) || 200,
    lossesPercent: parseFloat(lossesPercent) || 5,
  }

  const sizingCalc = useCallback((inp: SizingInputs) => {
    if (inp.loadKW <= 0 || inp.hours <= 0) return null
    return calculateSizing(inp)
  }, [])

  const sizingResults = useCalculator(sizingInputs, sizingCalc)

  const roiInputs: ROIInputs = {
    systemCost: parseFloat(systemCost) || 0,
    capacity: sizingResults ? sizingResults.totalEnergy : 0,
    peakRate: parseFloat(peakRate) || 0,
    offPeakRate: parseFloat(offPeakRate) || 0,
    roundTripEfficiency: parseFloat(roundTripEfficiency) || 0.85,
    cyclesPerDay: parseFloat(cyclesPerDay) || 1,
    monthlyPeakReduction: parseFloat(monthlyPeakReduction) || 0,
    demandChargeRate: parseFloat(demandChargeRate) || 0,
    degradationRate: parseFloat(degradationRate) || 0.02,
    discountRate: parseFloat(discountRate) || 0.08,
    analysisPeriod: parseFloat(analysisPeriod) || 10,
  }

  const roiCalc = useCallback((inp: ROIInputs) => {
    if (inp.systemCost <= 0 || inp.capacity <= 0) return null
    return calculateROI(inp)
  }, [])

  const roiResults = useCalculator(roiInputs, roiCalc)

  const chartData = roiResults?.yearlyData.map((d) => ({
    year: d.year,
    cumulative: Math.round(d.cumulative),
  })) ?? []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {[1, 2, 3].map((s) => (
          <button
            key={s}
            onClick={() => {
              if (s < step || (s === 2 && sizingResults) || (s === 3 && sizingResults && roiResults)) setStep(s)
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              step === s
                ? 'bg-accent-500 text-sg-900'
                : s < step
                  ? 'bg-sg-600 text-text cursor-pointer'
                  : 'bg-sg-800 text-text-dim'
            }`}
          >
            Step {s}
            <span className="text-xs font-normal">
              {s === 1 ? '— System' : s === 2 ? '— Financial' : '— Results'}
            </span>
          </button>
        ))}
      </div>

      {/* Step 1 — System Requirements */}
      {step === 1 && (
        <Card>
          <CardHeader title="System Requirements" subtitle="Define your BESS load and unit parameters" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Load" unit="kW" value={loadKW} onChange={setLoadKW} required tooltip="Total site electrical load" />
            <InputField label="Duration Needed" unit="hours" value={durationHours} onChange={setDurationHours} required tooltip="How many hours the BESS must support the load" />
            <SelectField
              label="Unit Capacity"
              unit="kWh"
              value={unitCapacity}
              onChange={setUnitCapacity}
              options={[
                { value: '60', label: '60 kWh' },
                { value: '100', label: '100 kWh' },
                { value: '200', label: '200 kWh' },
                { value: '500', label: '500 kWh' },
                { value: '1000', label: '1,000 kWh' },
              ]}
              required
            />
            <InputField label="Depth of Discharge" unit="%" value={dodPercent} onChange={setDodPercent} tooltip="Typical 80% to preserve battery life" />
            <InputField label="System Losses" unit="%" value={lossesPercent} onChange={setLossesPercent} tooltip="Inverter and wiring losses, typically 5%" />
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={() => setStep(2)} disabled={!sizingResults}>
              Next: Financial Parameters
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2 — Financial Parameters */}
      {step === 2 && (
        <Card>
          <CardHeader title="Financial Parameters" subtitle="Revenue assumptions for ROI analysis" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="System Cost" unit="$" value={systemCost} onChange={setSystemCost} required />
            <InputField label="Peak Rate" unit="$/kWh" value={peakRate} onChange={setPeakRate} required step="0.01" />
            <InputField label="Off-Peak Rate" unit="$/kWh" value={offPeakRate} onChange={setOffPeakRate} required step="0.01" />
            <InputField label="Round Trip Efficiency" value={roundTripEfficiency} onChange={setRoundTripEfficiency} step="0.01" tooltip="Battery charge/discharge efficiency" />
            <InputField label="Cycles/Day" value={cyclesPerDay} onChange={setCyclesPerDay} />
            <InputField label="Monthly Peak Reduction" unit="kW" value={monthlyPeakReduction} onChange={setMonthlyPeakReduction} tooltip="Demand shaving from BESS" />
            <InputField label="Demand Charge Rate" unit="$/kW" value={demandChargeRate} onChange={setDemandChargeRate} />
            <InputField label="Degradation Rate" value={degradationRate} onChange={setDegradationRate} step="0.01" tooltip="Annual capacity degradation (e.g. 0.02 = 2%/yr)" />
            <InputField label="Discount Rate" value={discountRate} onChange={setDiscountRate} step="0.01" tooltip="For NPV calculation (e.g. 0.08 = 8%)" />
            <InputField label="Analysis Period" unit="years" value={analysisPeriod} onChange={setAnalysisPeriod} />
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={!roiResults}>
              Next: View Results
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3 — Results */}
      {step === 3 && sizingResults && roiResults && (
        <>
          {/* Sizing Results */}
          <Card>
            <CardHeader title="System Sizing" subtitle="BESS units required based on load and duration" />
            <ResultGrid>
              <ResultItem label="Total Energy Required" value={fmt(sizingResults.totalEnergy)} unit="kWh" highlight />
              <ResultItem label="Usable per Unit" value={fmt(sizingResults.usablePerUnit)} unit="kWh" />
              <ResultItem label="Units Required" value={fmtInt(sizingResults.unitsRequired)} unit="units" highlight />
            </ResultGrid>
            <FormulaBreakdown steps={describeSizing(sizingInputs, sizingResults)} title="Sizing Formulas" />
          </Card>

          {/* ROI Results */}
          <Card>
            <CardHeader title="Financial Analysis" subtitle="Revenue projections and return on investment" />
            <ResultGrid>
              <ResultItem label="Daily Arbitrage" value={fmtCurrency(roiResults.dailyArbitrage, 2)} highlight />
              <ResultItem label="Annual Revenue" value={fmtCurrency(roiResults.annualRevenue)} />
              <ResultItem label="Net Present Value" value={fmtCurrency(roiResults.npv)} highlight />
              <ResultItem label="Simple Payback" value={fmt(roiResults.simplePayback)} unit="years" highlight />
            </ResultGrid>
            <FormulaBreakdown steps={describeROI(roiInputs, roiResults)} title="ROI Formulas" />
          </Card>

          {/* Cumulative Cash Flow Chart */}
          <Card>
            <CardHeader title="Cumulative Cash Flow" subtitle="Break-even visualization over analysis period" />
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    label={{ value: 'Year', position: 'insideBottom', offset: -4, fill: '#9ca3af', fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#242a38', border: '1px solid #2d3548', borderRadius: 8, color: '#f1f5f9' }}
                    formatter={(value: unknown) => [fmtCurrency(Number(value)), 'Cumulative']}
                    labelFormatter={(label: unknown) => `Year ${label}`}
                  />
                  <ReferenceLine y={0} stroke="#22c55e" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#c89a3c"
                    strokeWidth={2}
                    dot={{ fill: '#c89a3c', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Year-by-Year Table */}
          <Card>
            <CardHeader title="Year-by-Year Projection" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sg-600">
                    <th className="text-left py-2 text-text-muted font-medium">Year</th>
                    <th className="text-right py-2 text-text-muted font-medium">Revenue</th>
                    <th className="text-right py-2 text-text-muted font-medium">Cumulative</th>
                    <th className="text-right py-2 text-text-muted font-medium">NPV</th>
                  </tr>
                </thead>
                <tbody className="text-text">
                  {roiResults.yearlyData.map((row) => (
                    <tr key={row.year} className="border-b border-sg-700">
                      <td className="py-2">{row.year}</td>
                      <td className="text-right">{fmtCurrency(row.revenue)}</td>
                      <td className={`text-right ${row.cumulative >= 0 ? 'text-success' : 'text-error'}`}>
                        {fmtCurrency(row.cumulative)}
                      </td>
                      <td className="text-right">{fmtCurrency(row.npv)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* PDF Export */}
          <div className="flex justify-center py-4">
            <PdfExportButton
              document={
                <BessProjectPdfDoc
                  sizingInputs={sizingInputs}
                  sizingResults={sizingResults}
                  roiInputs={roiInputs}
                  roiResults={roiResults}
                />
              }
              filename="bess-project-report.pdf"
            />
          </div>

          {/* Back button */}
          <div className="flex justify-start">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Back to Financial Parameters
            </Button>
          </div>

          <div className="text-center text-xs text-text-dim py-2">
            These are estimates for reference only. Final sizing must be verified by a licensed professional engineer.
          </div>
        </>
      )}
    </div>
  )
}
