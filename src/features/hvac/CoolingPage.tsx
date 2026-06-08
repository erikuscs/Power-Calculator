import { useState, useCallback } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { SelectField } from '../../components/ui/SelectField'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { useCalculator } from '../../hooks/useCalculator'
import { calculateCooling, describeCooling, type CoolingInputs } from './hvac.formulas'
import { STRUCTURE_COOLING_MULTIPLIERS } from '../../lib/constants'
import { fmt } from '../../lib/formatters'
import { AlertTriangle } from 'lucide-react'

export default function CoolingPage() {
  const [loadKw, setLoadKw] = useState('100')
  const [sqFt, setSqFt] = useState('2000')
  const [ambientTemp, setAmbientTemp] = useState('95')
  const [targetTemp, setTargetTemp] = useState('72')
  const [occupants, setOccupants] = useState('0')
  const [structureType, setStructureType] = useState('container')

  const mult = STRUCTURE_COOLING_MULTIPLIERS[structureType]?.multiplier ?? 1.0

  const inputs: CoolingInputs = {
    loadKw: parseFloat(loadKw) || 0,
    sqFt: parseFloat(sqFt) || 0,
    ambientTemp: parseFloat(ambientTemp) || 95,
    targetTemp: parseFloat(targetTemp) || 72,
    occupants: parseInt(occupants) || 0,
    structureType,
    structureMultiplier: mult,
  }

  const calculate = useCallback((inp: CoolingInputs) => calculateCooling(inp), [])
  const results = useCalculator(inputs, calculate)

  const structureOptions = Object.entries(STRUCTURE_COOLING_MULTIPLIERS).map(([value, { label, multiplier }]) => ({
    value,
    label: `${label} (${multiplier}x)`,
  }))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader title="Cooling Load Calculator" subtitle="Equipment heat + envelope gains + occupant heat → cooling tonnage" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Equipment Load" unit="kW" value={loadKw} onChange={setLoadKw} required tooltip="Total electrical load generating heat" />
          <InputField label="Facility Size" unit="sq ft" value={sqFt} onChange={setSqFt} tooltip="Floor area — used for envelope heat gain" />
          <InputField label="Ambient Temperature" unit="°F" value={ambientTemp} onChange={setAmbientTemp} required />
          <InputField label="Target Temperature" unit="°F" value={targetTemp} onChange={setTargetTemp} required />
          <SelectField label="Structure Type" value={structureType} onChange={setStructureType} options={structureOptions} required tooltip="Affects envelope heat gain multiplier" />
          <InputField label="Occupants" value={occupants} onChange={setOccupants} required tooltip="Each person adds ~250 BTU/hr sensible + ~200 BTU/hr latent" />
        </div>

        {parseInt(occupants) === 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning">
            <AlertTriangle size={16} />
            Did you account for occupants? Each person adds ~450 BTU/hr total heat.
          </div>
        )}
      </Card>

      {results && (
        <Card>
          <CardHeader title="Results" />
          <ResultGrid>
            <ResultItem label="Equipment Heat" value={fmt(results.equipmentBtu, 0)} unit="BTU/hr" />
            <ResultItem label="Envelope Heat Gain" value={fmt(results.envelopeBtu, 0)} unit="BTU/hr" />
            <ResultItem label="Occupant Heat" value={fmt(results.occupantBtu, 0)} unit="BTU/hr" />
            <ResultItem label="Total Heat Gain" value={fmt(results.totalBtu, 0)} unit="BTU/hr" />
            <ResultItem label="Cooling Tonnage" value={fmt(results.tons, 1)} unit="tons" beforeMargin={`${fmt(results.tons, 1)} tons`} />
            <ResultItem label="Recommended (with 15% margin)" value={fmt(results.tonsWithMargin, 1)} unit="tons" highlight />
          </ResultGrid>
          <FormulaBreakdown steps={describeCooling(inputs, results)} />
        </Card>
      )}
    </div>
  )
}
