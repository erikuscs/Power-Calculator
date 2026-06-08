import { useCallback, useState } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { TabGroup } from '../../components/ui/TabGroup'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { useCalculator } from '../../hooks/useCalculator'
import { fmt } from '../../lib/formatters'
import {
  calcGeneralPower,
  describeGeneralPower,
  type GeneralPowerInputs,
  type GeneralPowerResults,
} from './power.formulas'

const PHASE_TABS = [
  { id: 'single', label: 'Single-Phase' },
  { id: 'three', label: 'Three-Phase' },
]

export default function GeneralPowerPage() {
  const [phase, setPhase] = useState<'single' | 'three'>('three')
  const [voltage, setVoltage] = useState('480')
  const [amperes, setAmperes] = useState('100')
  const [powerFactor, setPowerFactor] = useState('0.8')

  const inputs: GeneralPowerInputs = {
    voltage: parseFloat(voltage) || 0,
    amperes: parseFloat(amperes) || 0,
    powerFactor: parseFloat(powerFactor) || 0,
    phase,
  }

  const calculate = useCallback(
    (i: GeneralPowerInputs): GeneralPowerResults | null => {
      if (i.voltage <= 0 || i.amperes <= 0 || i.powerFactor <= 0) return null
      return calcGeneralPower(i)
    },
    [],
  )

  const results = useCalculator(inputs, calculate)
  const steps = results ? describeGeneralPower(inputs, results) : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="General Power Calculator"
          subtitle="Calculate real power (kW) and apparent power (kVA) from voltage, current, and power factor"
        />

        <TabGroup tabs={PHASE_TABS} activeTab={phase} onChange={(id) => setPhase(id as 'single' | 'three')} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <InputField
            label="Voltage"
            unit="V"
            value={voltage}
            onChange={setVoltage}
            min={0}
            tooltip="Line-to-line voltage for three-phase, line-to-neutral for single-phase"
          />
          <InputField
            label="Amperes"
            unit="A"
            value={amperes}
            onChange={setAmperes}
            min={0}
            tooltip="Current draw in amperes"
          />
          <InputField
            label="Power Factor"
            value={powerFactor}
            onChange={setPowerFactor}
            min={0}
            max={1}
            step={0.01}
            tooltip="Ratio of real power to apparent power (0 to 1)"
          />
        </div>

        {results && (
          <>
            <ResultGrid>
              <ResultItem label="Real Power" value={fmt(results.kw, 2)} unit="kW" highlight />
              <ResultItem label="Apparent Power" value={fmt(results.kva, 2)} unit="kVA" />
            </ResultGrid>
            <FormulaBreakdown steps={steps} />
          </>
        )}
      </Card>
    </div>
  )
}
