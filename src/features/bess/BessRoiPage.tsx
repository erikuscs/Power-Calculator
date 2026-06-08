import { useCallback, useState } from 'react'
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
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { useCalculator } from '../../hooks/useCalculator'
import { fmt, fmtCurrency } from '../../lib/formatters'
import {
  calculateROI,
  describeROI,
  type ROIInputs,
  type ROIResults,
} from './bess.formulas'

const CHART_COLORS = {
  gold: '#c89a3c',
  green: '#22c55e',
  grid: '#2d3548',
  background: '#242a38',
} as const

export default function BessRoiPage() {
  const [systemCost, setSystemCost] = useState('500000')
  const [capacity, setCapacity] = useState('1000')
  const [peakRate, setPeakRate] = useState('0.25')
  const [offPeakRate, setOffPeakRate] = useState('0.08')
  const [roundTripEfficiency, setRoundTripEfficiency] = useState('0.85')
  const [cyclesPerDay, setCyclesPerDay] = useState('1')
  const [monthlyPeakReduction, setMonthlyPeakReduction] = useState('200')
  const [demandChargeRate, setDemandChargeRate] = useState('15')
  const [degradationRate, setDegradationRate] = useState('0.02')
  const [discountRate, setDiscountRate] = useState('0.08')
  const [analysisPeriod, setAnalysisPeriod] = useState('10')

  const inputs: ROIInputs = {
    systemCost: parseFloat(systemCost) || 0,
    capacity: parseFloat(capacity) || 0,
    peakRate: parseFloat(peakRate) || 0,
    offPeakRate: parseFloat(offPeakRate) || 0,
    roundTripEfficiency: parseFloat(roundTripEfficiency) || 0.85,
    cyclesPerDay: parseFloat(cyclesPerDay) || 1,
    monthlyPeakReduction: parseFloat(monthlyPeakReduction) || 0,
    demandChargeRate: parseFloat(demandChargeRate) || 0,
    degradationRate: parseFloat(degradationRate) || 0.02,
    discountRate: parseFloat(discountRate) || 0.08,
    analysisPeriod: parseInt(analysisPeriod, 10) || 10,
  }

  const calculate = useCallback(
    (i: ROIInputs): ROIResults | null => {
      if (i.systemCost <= 0 || i.capacity <= 0) return null
      return calculateROI(i)
    },
    [],
  )

  const results = useCalculator(inputs, calculate)

  const steps = results ? describeROI(inputs, results) : []

  const chartData = results
    ? [
        { year: 0, cumulative: -inputs.systemCost },
        ...results.yearlyData.map((d) => ({
          year: d.year,
          cumulative: d.cumulative,
        })),
      ]
    : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="BESS Revenue / ROI Analysis"
          subtitle="Evaluate energy arbitrage revenue, demand charge savings, and investment payback"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <InputField
            label="System Cost"
            unit="$"
            value={systemCost}
            onChange={setSystemCost}
            min={0}
            tooltip="Total installed cost of the BESS system"
          />
          <InputField
            label="Capacity"
            unit="kWh"
            value={capacity}
            onChange={setCapacity}
            min={0}
            tooltip="Total usable energy capacity"
          />
          <InputField
            label="Peak Rate"
            unit="$/kWh"
            value={peakRate}
            onChange={setPeakRate}
            min={0}
            step="0.01"
            tooltip="Electricity rate during peak hours"
          />
          <InputField
            label="Off-Peak Rate"
            unit="$/kWh"
            value={offPeakRate}
            onChange={setOffPeakRate}
            min={0}
            step="0.01"
            tooltip="Electricity rate during off-peak hours"
          />
          <InputField
            label="Round Trip Efficiency"
            value={roundTripEfficiency}
            onChange={setRoundTripEfficiency}
            min={0}
            max={1}
            step="0.01"
            tooltip="Charge/discharge round-trip efficiency (0-1)"
          />
          <InputField
            label="Cycles per Day"
            value={cyclesPerDay}
            onChange={setCyclesPerDay}
            min={0}
            step="0.5"
            tooltip="Number of full charge/discharge cycles per day"
          />
          <InputField
            label="Monthly Peak Reduction"
            unit="kW"
            value={monthlyPeakReduction}
            onChange={setMonthlyPeakReduction}
            min={0}
            tooltip="Peak demand reduction achieved by the BESS"
          />
          <InputField
            label="Demand Charge Rate"
            unit="$/kW"
            value={demandChargeRate}
            onChange={setDemandChargeRate}
            min={0}
            step="0.5"
            tooltip="Monthly demand charge per kW of peak"
          />
          <InputField
            label="Degradation Rate"
            value={degradationRate}
            onChange={setDegradationRate}
            min={0}
            max={1}
            step="0.005"
            tooltip="Annual capacity degradation (e.g. 0.02 = 2%/yr)"
          />
          <InputField
            label="Discount Rate"
            value={discountRate}
            onChange={setDiscountRate}
            min={0}
            max={1}
            step="0.01"
            tooltip="Discount rate for NPV calculation"
          />
          <InputField
            label="Analysis Period"
            unit="years"
            value={analysisPeriod}
            onChange={setAnalysisPeriod}
            min={1}
            max={30}
            step="1"
            tooltip="Number of years to analyze"
          />
        </div>

        {results && (
          <>
            <ResultGrid>
              <ResultItem
                label="Daily Arbitrage Revenue"
                value={fmtCurrency(results.dailyArbitrage, 2)}
                unit="/day"
              />
              <ResultItem
                label="Annual Revenue (Year 1)"
                value={fmtCurrency(results.annualRevenue * (1 - inputs.degradationRate))}
                unit="/yr"
              />
              <ResultItem
                label="NPV"
                value={fmtCurrency(results.npv)}
              />
              <ResultItem
                label="Simple Payback"
                value={fmt(results.simplePayback, 1)}
                unit="years"
                highlight
              />
            </ResultGrid>

            {/* Cumulative Cash Flow Chart */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-text-muted mb-3">
                Cumulative Cash Flow
              </h3>
              <div className="rounded-lg border border-sg-600 p-4" style={{ backgroundColor: CHART_COLORS.background }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                    <XAxis
                      dataKey="year"
                      stroke="#8894a8"
                      tick={{ fill: '#8894a8', fontSize: 12 }}
                      label={{ value: 'Year', position: 'insideBottom', offset: -2, fill: '#8894a8', fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#8894a8"
                      tick={{ fill: '#8894a8', fontSize: 12 }}
                      tickFormatter={(v: number) =>
                        v >= 1000 || v <= -1000
                          ? `$${(v / 1000).toFixed(0)}k`
                          : `$${v}`
                      }
                      label={{ value: 'Cumulative ($)', angle: -90, position: 'insideLeft', offset: 0, fill: '#8894a8', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1f2e',
                        border: '1px solid #2d3548',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                      formatter={(value: unknown) => [fmtCurrency(Number(value)), 'Cumulative']}
                      labelFormatter={(label: unknown) => `Year ${label}`}
                    />
                    <ReferenceLine y={0} stroke={CHART_COLORS.green} strokeDasharray="4 4" strokeWidth={1.5} />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      stroke={CHART_COLORS.gold}
                      strokeWidth={2.5}
                      dot={{ fill: CHART_COLORS.gold, r: 3 }}
                      activeDot={{ r: 5, fill: CHART_COLORS.gold }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Year-by-Year Table */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-text-muted mb-3">
                Year-by-Year Breakdown
              </h3>
              <div className="overflow-x-auto rounded-lg border border-sg-600">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-sg-800 text-text-muted">
                      <th className="px-4 py-2.5 text-left font-medium">Year</th>
                      <th className="px-4 py-2.5 text-right font-medium">Revenue</th>
                      <th className="px-4 py-2.5 text-right font-medium">Cumulative</th>
                      <th className="px-4 py-2.5 text-right font-medium">NPV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.yearlyData.map((row) => (
                      <tr
                        key={row.year}
                        className="border-t border-sg-600 hover:bg-sg-800/50 transition-colors"
                      >
                        <td className="px-4 py-2 text-text">{row.year}</td>
                        <td className="px-4 py-2 text-right text-text">
                          {fmtCurrency(row.revenue)}
                        </td>
                        <td
                          className={`px-4 py-2 text-right font-medium ${
                            row.cumulative >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {fmtCurrency(row.cumulative)}
                        </td>
                        <td
                          className={`px-4 py-2 text-right ${
                            row.npv >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {fmtCurrency(row.npv)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <FormulaBreakdown steps={steps} />
          </>
        )}
      </Card>
    </div>
  )
}
