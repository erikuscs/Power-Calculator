import { useCallback, useState } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { RadioGroup } from '../../components/ui/RadioGroup'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { useCalculator } from '../../hooks/useCalculator'
import { fmt } from '../../lib/formatters'
import {
  calcKwHp,
  describeKwHp,
  type KwHpInputs,
  type KwHpResults,
} from './power.formulas'

const DIRECTION_OPTIONS = [
  { value: 'kwToHp', label: 'kW → HP' },
  { value: 'hpToKw', label: 'HP → kW' },
]

export default function KwHpPage() {
  const [direction, setDirection] = useState<'kwToHp' | 'hpToKw'>('kwToHp')
  const [value, setValue] = useState('100')

  const inputs: KwHpInputs = {
    value: parseFloat(value) || 0,
    direction,
  }

  const calculate = useCallback(
    (i: KwHpInputs): KwHpResults | null => {
      if (i.value <= 0) return null
      return calcKwHp(i)
    },
    [],
  )

  const results = useCalculator(inputs, calculate)
  const steps = results ? describeKwHp(inputs, results) : []

  const inputLabel = direction === 'kwToHp' ? 'Power (kW)' : 'Power (HP)'
  const inputUnit = direction === 'kwToHp' ? 'kW' : 'HP'
  const resultLabel = direction === 'kwToHp' ? 'Horsepower' : 'Kilowatts'
  const resultUnit = direction === 'kwToHp' ? 'HP' : 'kW'

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="kW ↔ HP Converter"
          subtitle="Convert between kilowatts and horsepower"
        />

        <div className="mb-4">
          <RadioGroup
            label="Conversion Direction"
            value={direction}
            onChange={(v) => setDirection(v as 'kwToHp' | 'hpToKw')}
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
