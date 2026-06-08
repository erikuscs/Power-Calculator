import { useCallback, useState } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { TabGroup } from '../../components/ui/TabGroup'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { useCalculator } from '../../hooks/useCalculator'
import { fmt } from '../../lib/formatters'
import {
  calcGeneratorPower,
  describeGeneratorPower,
  type GeneratorPowerInputs,
  type GeneratorPowerResults,
} from './power.formulas'

const PHASE_TABS = [
  { id: 'single', label: 'Single-Phase' },
  { id: 'three', label: 'Three-Phase' },
]

export default function GeneratorPowerPage() {
  const [phase, setPhase] = useState<'single' | 'three'>('three')
  const [voltage, setVoltage] = useState('480')
  const [amperes, setAmperes] = useState('100')
  const [powerFactor, setPowerFactor] = useState('0.8')

  const inputs: GeneratorPowerInputs = {
    voltage: parseFloat(voltage) || 0,
    amperes: parseFloat(amperes) || 0,
    powerFactor: parseFloat(powerFactor) || 0,
    phase,
  }

  const calculate = useCallback(
    (i: GeneratorPowerInputs): GeneratorPowerResults | null => {
      if (i.voltage <= 0 || i.amperes <= 0 || i.powerFactor <= 0) return null
      return calcGeneratorPower(i)
    },
    [],
  )

  const results = useCalculator(inputs, calculate)
  const steps = results ? describeGeneratorPower(inputs, results) : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Generator Power Calculator"
          subtitle="Size a generator with 125% safety margin for continuous load"
        />

        <TabGroup tabs={PHASE_TABS} activeTab={phase} onChange={(id) => setPhase(id as 'single' | 'three')} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <InputField
            label="Voltage"
            unit="V"
            value={voltage}
            onChange={setVoltage}
            min={0}
            tooltip="Line-to-line voltage"
          />
          <InputField
            label="Amperes"
            unit="A"
            value={amperes}
            onChange={setAmperes}
            min={0}
            tooltip="Full load current"
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
              <ResultItem
                label="Generator kW (with margin)"
                value={fmt(results.kwMargin, 2)}
                unit="kW"
                highlight
                beforeMargin={`${fmt(results.kwRaw, 2)} kW`}
              />
              <ResultItem
                label="Generator kVA (with margin)"
                value={fmt(results.kvaMargin, 2)}
                unit="kVA"
                highlight
                beforeMargin={`${fmt(results.kvaRaw, 2)} kVA`}
              />
            </ResultGrid>
            <FormulaBreakdown steps={steps} />
          </>
        )}
      </Card>
    </div>
  )
}
