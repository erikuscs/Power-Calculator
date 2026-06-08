import { useCallback, useState } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { TabGroup } from '../../components/ui/TabGroup'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { useCalculator } from '../../hooks/useCalculator'
import { fmt } from '../../lib/formatters'
import {
  calcUpsPower,
  describeUpsPower,
  type UpsPowerInputs,
  type UpsPowerResults,
} from './power.formulas'

const PHASE_TABS = [
  { id: 'single', label: 'Single-Phase' },
  { id: 'three', label: 'Three-Phase' },
]

export default function UpsPowerPage() {
  const [phase, setPhase] = useState<'single' | 'three'>('single')
  const [voltage, setVoltage] = useState('240')
  const [amperes, setAmperes] = useState('20')
  const [powerFactor, setPowerFactor] = useState('0.8')
  const [batteryKwh, setBatteryKwh] = useState('10')

  const inputs: UpsPowerInputs = {
    voltage: parseFloat(voltage) || 0,
    amperes: parseFloat(amperes) || 0,
    powerFactor: parseFloat(powerFactor) || 0,
    phase,
    batteryKwh: parseFloat(batteryKwh) || 0,
  }

  const calculate = useCallback(
    (i: UpsPowerInputs): UpsPowerResults | null => {
      if (i.voltage <= 0 || i.amperes <= 0 || i.powerFactor <= 0 || i.batteryKwh <= 0) return null
      return calcUpsPower(i)
    },
    [],
  )

  const results = useCalculator(inputs, calculate)
  const steps = results ? describeUpsPower(inputs, results) : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="UPS Power Calculator"
          subtitle="Calculate UPS load and estimate battery backup runtime"
        />

        <TabGroup tabs={PHASE_TABS} activeTab={phase} onChange={(id) => setPhase(id as 'single' | 'three')} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <InputField
            label="Voltage"
            unit="V"
            value={voltage}
            onChange={setVoltage}
            min={0}
            tooltip="System voltage"
          />
          <InputField
            label="Amperes"
            unit="A"
            value={amperes}
            onChange={setAmperes}
            min={0}
            tooltip="Load current"
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
          <InputField
            label="Battery Capacity"
            unit="kWh"
            value={batteryKwh}
            onChange={setBatteryKwh}
            min={0}
            tooltip="Total battery energy capacity"
          />
        </div>

        {results && (
          <>
            <ResultGrid>
              <ResultItem label="Load Power" value={fmt(results.kw, 2)} unit="kW" />
              <ResultItem label="Apparent Power" value={fmt(results.kva, 2)} unit="kVA" />
              <ResultItem label="Battery Runtime" value={fmt(results.runtimeHours, 2)} unit="hours" highlight />
            </ResultGrid>
            <FormulaBreakdown steps={steps} />
          </>
        )}
      </Card>
    </div>
  )
}
