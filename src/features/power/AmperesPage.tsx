import { useCallback, useState } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { TabGroup } from '../../components/ui/TabGroup'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { useCalculator } from '../../hooks/useCalculator'
import { fmt } from '../../lib/formatters'
import {
  calcAmperes,
  describeAmperes,
  type AmperesInputs,
  type AmperesResults,
} from './power.formulas'

const PHASE_TABS = [
  { id: 'single', label: 'Single-Phase' },
  { id: 'three', label: 'Three-Phase' },
]

export default function AmperesPage() {
  const [phase, setPhase] = useState<'single' | 'three'>('three')
  const [kw, setKw] = useState('10')
  const [voltage, setVoltage] = useState('480')
  const [powerFactor, setPowerFactor] = useState('0.8')

  const inputs: AmperesInputs = {
    kw: parseFloat(kw) || 0,
    voltage: parseFloat(voltage) || 0,
    powerFactor: parseFloat(powerFactor) || 0,
    phase,
  }

  const calculate = useCallback(
    (i: AmperesInputs): AmperesResults | null => {
      if (i.kw <= 0 || i.voltage <= 0 || i.powerFactor <= 0) return null
      return calcAmperes(i)
    },
    [],
  )

  const results = useCalculator(inputs, calculate)
  const steps = results ? describeAmperes(inputs, results) : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Amperes Calculator"
          subtitle="Calculate current draw from kW, voltage, and power factor"
        />

        <TabGroup tabs={PHASE_TABS} activeTab={phase} onChange={(id) => setPhase(id as 'single' | 'three')} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <InputField
            label="Power"
            unit="kW"
            value={kw}
            onChange={setKw}
            min={0}
            tooltip="Real power in kilowatts"
          />
          <InputField
            label="Voltage"
            unit="V"
            value={voltage}
            onChange={setVoltage}
            min={0}
            tooltip="System voltage"
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
              <ResultItem label="Current" value={fmt(results.amperes, 2)} unit="A" highlight />
            </ResultGrid>
            <FormulaBreakdown steps={steps} />
          </>
        )}
      </Card>
    </div>
  )
}
