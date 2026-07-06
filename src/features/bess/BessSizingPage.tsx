import { useCallback, useState } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { SelectField } from '../../components/ui/SelectField'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { useCalculator } from '../../hooks/useCalculator'
import { fmt, fmtInt } from '../../lib/formatters'
import { BESS_UNIT_SIZES } from '../../lib/constants'
import {
  calculateSizing,
  describeSizing,
  type SizingInputs,
  type SizingResults,
} from './bess.formulas'

const UNIT_CAPACITY_OPTIONS = BESS_UNIT_SIZES.map((size) => ({
  value: String(size),
  label: `${size} kWh`,
}))

export default function BessSizingPage() {
  const [loadKW, setLoadKW] = useState('100')
  const [hours, setHours] = useState('8')
  const [dodPercent, setDodPercent] = useState('80')
  const [unitCapacity, setUnitCapacity] = useState('500')
  const [lossesPercent, setLossesPercent] = useState('5')

  const inputs: SizingInputs = {
    loadKW: parseFloat(loadKW) || 0,
    hours: parseFloat(hours) || 0,
    dodPercent: parseFloat(dodPercent) || 0,
    unitCapacity: parseFloat(unitCapacity) || 0,
    lossesPercent: parseFloat(lossesPercent) || 0,
  }

  const calculate = useCallback(
    (i: SizingInputs): SizingResults | null => {
      if (i.loadKW <= 0 || i.hours <= 0 || i.dodPercent <= 0 || i.dodPercent > 100 || i.unitCapacity <= 0 || i.lossesPercent < 0 || i.lossesPercent >= 100) return null
      return calculateSizing(i)
    },
    [],
  )

  const results = useCalculator(inputs, calculate)

  const steps = results ? describeSizing(inputs, results) : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Multi-Unit BESS Sizing"
          subtitle="Determine how many battery units are needed for your load profile"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <InputField
            label="Load"
            unit="kW"
            value={loadKW}
            onChange={setLoadKW}
            min={0}
            tooltip="Average continuous load in kilowatts"
          />
          <InputField
            label="Duration"
            unit="hours"
            value={hours}
            onChange={setHours}
            min={0}
            tooltip="Required runtime in hours"
          />
          <InputField
            label="Depth of Discharge"
            unit="%"
            value={dodPercent}
            onChange={setDodPercent}
            min={0}
            max={100}
            tooltip="Maximum depth of discharge (typically 80%)"
            warning={parseFloat(dodPercent) > 80 ? 'DoD above 80% reduces battery life' : undefined}
          />
          <SelectField
            label="Unit Capacity"
            unit="kWh"
            value={unitCapacity}
            onChange={setUnitCapacity}
            options={UNIT_CAPACITY_OPTIONS}
            tooltip="Energy capacity per BESS unit"
          />
          <InputField
            label="System Losses"
            unit="%"
            value={lossesPercent}
            onChange={setLossesPercent}
            min={0}
            max={100}
            tooltip="Round-trip conversion & parasitic losses"
          />
        </div>

        {results && (
          <>
            <ResultGrid>
              <ResultItem
                label="Total Energy Required"
                value={fmt(results.totalEnergy, 1)}
                unit="kWh"
              />
              <ResultItem
                label="Usable per Unit"
                value={fmt(results.usablePerUnit, 1)}
                unit="kWh"
              />
              <ResultItem
                label="Units Required"
                value={fmtInt(results.unitsRequired)}
                unit="units"
                highlight
              />
            </ResultGrid>

            <FormulaBreakdown steps={steps} />

            <div className="mt-4 px-4 py-3 bg-sg-800 border border-sg-600 rounded-lg text-sm text-text-muted">
              <span className="text-accent-400 font-medium">Safety note:</span>{' '}
              BESS sized at 120% with DoD &le; 80% to ensure adequate reserve capacity and battery longevity.
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
