import { useCallback, useState } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { SelectField } from '../../components/ui/SelectField'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { useCalculator } from '../../hooks/useCalculator'
import { fmt } from '../../lib/formatters'
import {
  calcLumensWatts,
  describeLumensWatts,
  type LumensWattsInputs,
  type LumensWattsResults,
} from './power.formulas'

const LAMP_OPTIONS = [
  { value: 'LED', label: 'LED (90 lm/W)' },
  { value: 'CFL', label: 'CFL (55 lm/W)' },
  { value: 'Fluorescent', label: 'Fluorescent (60 lm/W)' },
  { value: 'Halogen', label: 'Halogen (20 lm/W)' },
  { value: 'Incandescent', label: 'Incandescent (15 lm/W)' },
]

export default function LumensWattsPage() {
  const [lumens, setLumens] = useState('1800')
  const [lampType, setLampType] = useState('LED')

  const inputs: LumensWattsInputs = {
    lumens: parseFloat(lumens) || 0,
    lampType,
  }

  const calculate = useCallback(
    (i: LumensWattsInputs): LumensWattsResults | null => {
      if (i.lumens <= 0) return null
      return calcLumensWatts(i)
    },
    [],
  )

  const results = useCalculator(inputs, calculate)
  const steps = results ? describeLumensWatts(inputs, results) : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Lumens & Watts Calculator"
          subtitle="Convert lumens to watts based on lamp type efficacy"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <InputField
            label="Lumens"
            unit="lm"
            value={lumens}
            onChange={setLumens}
            min={0}
            tooltip="Desired light output in lumens"
          />
          <SelectField
            label="Lamp Type"
            value={lampType}
            onChange={setLampType}
            options={LAMP_OPTIONS}
            tooltip="Lamp technology determines efficacy (lumens per watt)"
          />
        </div>

        {results && (
          <>
            <ResultGrid>
              <ResultItem label="Power Required" value={fmt(results.watts, 1)} unit="W" highlight />
              <ResultItem label="Lamp Efficacy" value={fmt(results.efficacy, 0)} unit="lm/W" />
            </ResultGrid>
            <FormulaBreakdown steps={steps} />
          </>
        )}
      </Card>
    </div>
  )
}
