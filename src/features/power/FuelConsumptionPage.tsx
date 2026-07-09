import { useCallback } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { RadioGroup } from '../../components/ui/RadioGroup'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { PdfExportButton } from '../../components/pdf/PdfExportButton'
import { GenericCalculatorPdf } from '../../components/pdf/GenericCalculatorPdf'
import { useCalculator } from '../../hooks/useCalculator'
import { usePersistedState } from '../../hooks/usePersistedState'
import { fmt, fmtPercent } from '../../lib/formatters'
import {
  calcFuelConsumption,
  describeFuelConsumption,
  type FuelConsumptionInputs,
  type FuelConsumptionResults,
} from './power.formulas'

const ROUTE_KEY = '/power/fuel-consumption'

const FUEL_OPTIONS = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'naturalGas', label: 'Natural Gas' },
]

export default function FuelConsumptionPage() {
  const [actualKw, setActualKw] = usePersistedState(ROUTE_KEY, 'actualKw', '375')
  const [ratedKw, setRatedKw] = usePersistedState(ROUTE_KEY, 'ratedKw', '500')
  const [hours, setHours] = usePersistedState(ROUTE_KEY, 'hours', '24')
  const [altitude, setAltitude] = usePersistedState(ROUTE_KEY, 'altitude', '0')
  const [ambientF, setAmbientF] = usePersistedState(ROUTE_KEY, 'ambientF', '77')
  const [fuelType, setFuelType] = usePersistedState<'diesel' | 'naturalGas'>(ROUTE_KEY, 'fuelType', 'diesel')

  const inputs: FuelConsumptionInputs = {
    actualKw: parseFloat(actualKw) || 0,
    ratedKw: parseFloat(ratedKw) || 0,
    hours: parseFloat(hours) || 0,
    altitude: parseFloat(altitude) || 0,
    ambientF: parseFloat(ambientF) || 77,
    fuelType,
  }

  const calculate = useCallback(
    (i: FuelConsumptionInputs): FuelConsumptionResults | null => {
      if (i.actualKw <= 0 || i.ratedKw <= 0 || i.hours <= 0) return null
      return calcFuelConsumption(i)
    },
    [],
  )

  const results = useCalculator(inputs, calculate)
  const steps = results ? describeFuelConsumption(inputs, results) : []

  const isDiesel = fuelType === 'diesel'
  const rateLabel = isDiesel ? 'Fuel Rate' : 'Gas Flow Rate'
  const rateUnit = isDiesel ? 'gal/hr' : 'CFH'
  const totalLabel = isDiesel ? 'Total Fuel' : 'Total Gas'
  const totalUnit = isDiesel ? 'gallons' : 'cu ft'

  const loadFactor = results ? results.loadFactor : 0
  const isEfficient = loadFactor >= 0.7 && loadFactor <= 0.8

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Fuel Consumption Calculator"
          subtitle="Estimate diesel or natural gas consumption with altitude and temperature derating"
        />

        <div className="mb-4">
          <RadioGroup
            label="Fuel Type"
            value={fuelType}
            onChange={(v) => setFuelType(v as 'diesel' | 'naturalGas')}
            options={FUEL_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <InputField
            label="Actual Load"
            unit="kW"
            value={actualKw}
            onChange={setActualKw}
            min={0}
            tooltip="Actual electrical load on the generator"
          />
          <InputField
            label="Generator Rated Capacity"
            unit="kW"
            value={ratedKw}
            onChange={setRatedKw}
            min={0}
            tooltip="Nameplate rated capacity. Field audit lesson: we've measured sites running 24% utilization — burning fuel around the clock for capacity that was never used"
          />
          <InputField
            label="Runtime"
            unit="hours"
            value={hours}
            onChange={setHours}
            min={0}
            tooltip="Expected runtime duration"
          />
          <InputField
            label="Altitude"
            unit="ft"
            value={altitude}
            onChange={setAltitude}
            min={0}
            tooltip="Site elevation above sea level. Derating begins above 1,000 ft."
          />
          <InputField
            label="Ambient Temperature"
            unit="°F"
            value={ambientF}
            onChange={setAmbientF}
            tooltip="Ambient air temperature. Derating begins above 77°F."
          />
        </div>

        {results && (
          <>
            <div className="mb-4 p-3 rounded-lg bg-sg-800 border border-sg-600">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-accent-300">
                  {fmtPercent(results.loadFactor, 1)}
                </div>
                <div>
                  <div className="text-sm font-medium text-text">Load Factor</div>
                  <div className={`text-xs ${isEfficient ? 'text-accent-400' : 'text-warning'}`}>
                    {isEfficient
                      ? 'Optimal range for fuel efficiency'
                      : 'Generators run most efficiently at 70-80% load factor.'}
                  </div>
                </div>
              </div>
            </div>

            <ResultGrid>
              <ResultItem
                label="Load Factor"
                value={fmtPercent(results.loadFactor, 1)}
                highlight
              />
              <ResultItem
                label="BSFC"
                value={fmt(results.bsfc, 4)}
                unit="gal/kWh"
              />
              <ResultItem
                label={rateLabel}
                value={fmt(results.gallonsPerHour, 2)}
                unit={rateUnit}
                highlight
              />
              <ResultItem
                label={totalLabel}
                value={fmt(results.totalFuel, 1)}
                unit={totalUnit}
                highlight
              />
              <ResultItem
                label="Altitude Derating"
                value={fmt(results.altitudeDerating, 4)}
                unit="factor"
              />
              <ResultItem
                label="Temperature Derating"
                value={fmt(results.tempDerating, 4)}
                unit="factor"
              />
            </ResultGrid>

            <FormulaBreakdown steps={steps} />

            <div className="mt-4 flex justify-center">
              <PdfExportButton
                document={
                  <GenericCalculatorPdf
                    title="Fuel Consumption Report"
                    inputs={[
                      { label: 'Actual Load', value: `${actualKw} kW` },
                      { label: 'Generator Rated Capacity', value: `${ratedKw} kW` },
                      { label: 'Runtime', value: `${hours} hours` },
                      { label: 'Altitude', value: `${altitude} ft ASL` },
                      { label: 'Ambient Temperature', value: `${ambientF} °F` },
                      { label: 'Fuel Type', value: fuelType === 'diesel' ? 'Diesel' : 'Natural Gas' },
                    ]}
                    results={[
                      { label: 'Load Factor', value: fmtPercent(results.loadFactor, 1) },
                      { label: 'BSFC', value: fmt(results.bsfc, 4), unit: 'gal/kWh' },
                      { label: rateLabel, value: fmt(results.gallonsPerHour, 2), unit: rateUnit },
                      { label: totalLabel, value: fmt(results.totalFuel, 1), unit: totalUnit },
                      { label: 'Altitude Derating', value: fmt(results.altitudeDerating, 4) },
                      { label: 'Temperature Derating', value: fmt(results.tempDerating, 4) },
                    ]}
                    formulaSteps={steps.map((s) => ({ label: s.label, result: s.result }))}
                    warnings={!isEfficient ? ['Generator not running at optimal load factor (70-80%). Consider right-sizing.'] : undefined}
                  />
                }
                filename="fuel-consumption-report.pdf"
              />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
