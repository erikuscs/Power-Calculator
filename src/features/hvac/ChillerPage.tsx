import { useState, useCallback } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { useCalculator } from '../../hooks/useCalculator'
import { calculateChiller, describeChiller, type ChillerInputs } from './hvac.formulas'
import { fmt } from '../../lib/formatters'

export default function ChillerPage() {
  const [enteringTemp, setEnteringTemp] = useState('55')
  const [leavingTemp, setLeavingTemp] = useState('45')
  const [gpm, setGpm] = useState('120')
  const [specificHeat, setSpecificHeat] = useState('1')
  const [specificGravity, setSpecificGravity] = useState('1')

  const inputs: ChillerInputs = {
    enteringTemp: parseFloat(enteringTemp) || 0,
    leavingTemp: parseFloat(leavingTemp) || 0,
    gpm: parseFloat(gpm) || 0,
    specificHeat: parseFloat(specificHeat) || 1,
    specificGravity: parseFloat(specificGravity) || 1,
  }

  const calculate = useCallback((inp: ChillerInputs) => calculateChiller(inp), [])
  const results = useCalculator(inputs, calculate)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader title="Chiller Sizing" subtitle="2.4 GPM/Ton flow, ~10°F heat rejection per pass" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Entering Water Temp" unit="°F" value={enteringTemp} onChange={setEnteringTemp} required />
          <InputField label="Leaving Water Temp" unit="°F" value={leavingTemp} onChange={setLeavingTemp} required />
          <InputField label="Flow Rate" unit="GPM" value={gpm} onChange={setGpm} required tooltip="2.4 GPM per ton is standard" />
          <InputField label="Specific Heat" value={specificHeat} onChange={setSpecificHeat} tooltip="Water = 1.0, glycol solutions are lower" />
          <InputField label="Specific Gravity" value={specificGravity} onChange={setSpecificGravity} tooltip="Water = 1.0" />
        </div>
      </Card>

      {results && (
        <Card>
          <CardHeader title="Results" />
          <ResultGrid>
            <ResultItem label="Temperature Difference" value={fmt(results.deltaT, 1)} unit="°F" />
            <ResultItem label="Cooling Capacity" value={fmt(results.btuPerHour, 0)} unit="BTU/hr" />
            <ResultItem label="Chiller Tonnage" value={fmt(results.tons, 1)} unit="tons" highlight />
          </ResultGrid>
          <FormulaBreakdown steps={describeChiller(inputs, results)} />
        </Card>
      )}
    </div>
  )
}
