import { useCallback, useState } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { RadioGroup } from '../../components/ui/RadioGroup'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { useCalculator } from '../../hooks/useCalculator'
import { fmt } from '../../lib/formatters'
import {
  calcKwKva,
  describeKwKva,
  type KwKvaInputs,
  type KwKvaResults,
} from './power.formulas'

const DIRECTION_OPTIONS = [
  { value: 'kwToKva', label: 'kW → kVA' },
  { value: 'kvaToKw', label: 'kVA → kW' },
]

export default function KwKvaPage() {
  const [direction, setDirection] = useState<'kwToKva' | 'kvaToKw'>('kwToKva')
  const [value, setValue] = useState('80')
  const [powerFactor, setPowerFactor] = useState('0.8')

  const inputs: KwKvaInputs = {
    value: parseFloat(value) || 0,
    powerFactor: parseFloat(powerFactor) || 0,
    direction,
  }

  const calculate = useCallback(
    (i: KwKvaInputs): KwKvaResults | null => {
      if (i.value <= 0 || i.powerFactor <= 0) return null
      return calcKwKva(i)
    },
    [],
  )

  const results = useCalculator(inputs, calculate)
  const steps = results ? describeKwKva(inputs, results) : []

  const inputLabel = direction === 'kwToKva' ? 'Power (kW)' : 'Power (kVA)'
  const inputUnit = direction === 'kwToKva' ? 'kW' : 'kVA'
  const resultLabel = direction === 'kwToKva' ? 'Apparent Power' : 'Real Power'
  const resultUnit = direction === 'kwToKva' ? 'kVA' : 'kW'

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="kW ↔ kVA Converter"
          subtitle="Convert between real power (kW) and apparent power (kVA)"
        />

        <div className="mb-4">
          <RadioGroup
            label="Conversion Direction"
            value={direction}
            onChange={(v) => setDirection(v as 'kwToKva' | 'kvaToKw')}
            options={DIRECTION_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <InputField
            label={inputLabel}
            unit={inputUnit}
            value={value}
            onChange={setValue}
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
