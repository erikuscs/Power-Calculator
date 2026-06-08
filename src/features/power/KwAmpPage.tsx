import { useCallback, useState } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { TabGroup } from '../../components/ui/TabGroup'
import { RadioGroup } from '../../components/ui/RadioGroup'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { useCalculator } from '../../hooks/useCalculator'
import { fmt } from '../../lib/formatters'
import {
  calcKwAmp,
  describeKwAmp,
  type KwAmpInputs,
  type KwAmpResults,
} from './power.formulas'

const PHASE_TABS = [
  { id: 'single', label: 'Single-Phase' },
  { id: 'three', label: 'Three-Phase' },
]

const DIRECTION_OPTIONS = [
  { value: 'kwToAmp', label: 'kW → Amps' },
  { value: 'ampToKw', label: 'Amps → kW' },
]

export default function KwAmpPage() {
  const [phase, setPhase] = useState<'single' | 'three'>('three')
  const [direction, setDirection] = useState<'kwToAmp' | 'ampToKw'>('kwToAmp')
  const [value, setValue] = useState('10')
  const [voltage, setVoltage] = useState('480')
  const [powerFactor, setPowerFactor] = useState('0.8')

  const inputs: KwAmpInputs = {
    value: parseFloat(value) || 0,
    voltage: parseFloat(voltage) || 0,
    powerFactor: parseFloat(powerFactor) || 0,
    phase,
    direction,
  }

  const calculate = useCallback(
    (i: KwAmpInputs): KwAmpResults | null => {
      if (i.value <= 0 || i.voltage <= 0 || i.powerFactor <= 0) return null
      return calcKwAmp(i)
    },
    [],
  )

  const results = useCalculator(inputs, calculate)
  const steps = results ? describeKwAmp(inputs, results) : []

  const inputLabel = direction === 'kwToAmp' ? 'Power' : 'Current'
  const inputUnit = direction === 'kwToAmp' ? 'kW' : 'A'
  const resultLabel = direction === 'kwToAmp' ? 'Current' : 'Real Power'
  const resultUnit = direction === 'kwToAmp' ? 'A' : 'kW'

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="kW ↔ Amps Converter"
          subtitle="Convert between kilowatts and amperes with phase selection"
        />

        <TabGroup tabs={PHASE_TABS} activeTab={phase} onChange={(id) => setPhase(id as 'single' | 'three')} />

        <div className="mb-4">
          <RadioGroup
            label="Conversion Direction"
            value={direction}
            onChange={(v) => setDirection(v as 'kwToAmp' | 'ampToKw')}
            options={DIRECTION_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <InputField
            label={inputLabel}
            unit={inputUnit}
            value={value}
            onChange={setValue}
            min={0}
          />
          <InputField
            label="Voltage"
            unit="V"
            value={voltage}
            onChange={setVoltage}
            min={0}
          />
          <InputField
            label="Power Factor"
            value={powerFactor}
            onChange={setPowerFactor}
            min={0}
            max={1}
            step={0.01}
            tooltip="Power factor (0 to 1)"
          />
        </div>

        {results && (
          <>
            <ResultGrid>
              <ResultItem label={resultLabel} value={fmt(results.result, 2)} unit={resultUnit} highlight />
            </ResultGrid>
            <FormulaBreakdown steps={steps} />
          </>
        )}
      </Card>
    </div>
  )
}
