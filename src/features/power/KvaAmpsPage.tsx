import { useCallback, useState } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { TabGroup } from '../../components/ui/TabGroup'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { useCalculator } from '../../hooks/useCalculator'
import { fmt } from '../../lib/formatters'
import {
  calcKvaAmps,
  describeKvaAmps,
  type KvaAmpsInputs,
  type KvaAmpsResults,
} from './power.formulas'

const PHASE_TABS = [
  { id: 'single', label: 'Single-Phase' },
  { id: 'three', label: 'Three-Phase' },
]

export default function KvaAmpsPage() {
  const [phase, setPhase] = useState<'single' | 'three'>('three')
  const [kva, setKva] = useState('100')
  const [voltage, setVoltage] = useState('480')

  const inputs: KvaAmpsInputs = {
    kva: parseFloat(kva) || 0,
    voltage: parseFloat(voltage) || 0,
    phase,
  }

  const calculate = useCallback(
    (i: KvaAmpsInputs): KvaAmpsResults | null => {
      if (i.kva <= 0 || i.voltage <= 0) return null
      return calcKvaAmps(i)
    },
    [],
  )

  const results = useCalculator(inputs, calculate)
  const steps = results ? describeKvaAmps(inputs, results) : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="kVA → Amps Calculator"
          subtitle="Calculate current from apparent power (kVA) and voltage"
        />

        <TabGroup tabs={PHASE_TABS} activeTab={phase} onChange={(id) => setPhase(id as 'single' | 'three')} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <InputField
            label="Apparent Power"
            unit="kVA"
            value={kva}
            onChange={setKva}
            min={0}
            tooltip="Apparent power in kilovolt-amperes"
          />
          <InputField
            label="Voltage"
            unit="V"
            value={voltage}
            onChange={setVoltage}
            min={0}
            tooltip="System voltage"
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
