import { useCallback } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { SelectField } from '../../components/ui/SelectField'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { PdfExportButton } from '../../components/pdf/PdfExportButton'
import { GenericCalculatorPdf } from '../../components/pdf/GenericCalculatorPdf'
import { useCalculator } from '../../hooks/useCalculator'
import { usePersistedState } from '../../hooks/usePersistedState'
import { calculateCooling, describeCooling, type CoolingInputs } from './hvac.formulas'
import { STRUCTURE_COOLING_MULTIPLIERS } from '../../lib/constants'
import { fmt } from '../../lib/formatters'
import { AlertTriangle } from 'lucide-react'

const ROUTE_KEY = '/hvac/cooling'

export default function CoolingPage() {
  const [loadKw, setLoadKw] = usePersistedState(ROUTE_KEY, 'loadKw', '100')
  const [sqFt, setSqFt] = usePersistedState(ROUTE_KEY, 'sqFt', '2000')
  const [ambientTemp, setAmbientTemp] = usePersistedState(ROUTE_KEY, 'ambientTemp', '95')
  const [targetTemp, setTargetTemp] = usePersistedState(ROUTE_KEY, 'targetTemp', '72')
  const [occupants, setOccupants] = usePersistedState(ROUTE_KEY, 'occupants', '0')
  const [structureType, setStructureType] = usePersistedState(ROUTE_KEY, 'structureType', 'container')
  const [rh, setRh] = usePersistedState(ROUTE_KEY, 'rh', '')

  const mult = STRUCTURE_COOLING_MULTIPLIERS[structureType]?.multiplier ?? 1.0
  const rhValue = parseFloat(rh) || 0

  const inputs: CoolingInputs = {
    loadKw: parseFloat(loadKw) || 0,
    sqFt: parseFloat(sqFt) || 0,
    ambientTemp: parseFloat(ambientTemp) || 95,
    targetTemp: parseFloat(targetTemp) || 72,
    occupants: parseInt(occupants) || 0,
    structureType,
    structureMultiplier: mult,
    relativeHumidity: rhValue > 0 ? rhValue : undefined,
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
          <InputField label="Relative Humidity" unit="% RH" value={rh} onChange={setRh} placeholder="Optional" tooltip="Leave blank for standard conditions. Above 60% RH, latent load is added automatically." />
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
            {results.latentBtu > 0 && <ResultItem label="Latent Load (Humidity)" value={fmt(results.latentBtu, 0)} unit="BTU/hr" />}
            <ResultItem label="Total Heat Gain" value={fmt(results.totalBtu, 0)} unit="BTU/hr" />
            <ResultItem label="Cooling Tonnage" value={fmt(results.tons, 1)} unit="tons" beforeMargin={`${fmt(results.tons, 1)} tons`} />
            <ResultItem label="Recommended (with 15% margin)" value={fmt(results.tonsWithMargin, 1)} unit="tons" highlight />
          </ResultGrid>
          <FormulaBreakdown steps={describeCooling(inputs, results)} />

          <div className="mt-4 flex justify-center">
            <PdfExportButton
              document={
                <GenericCalculatorPdf
                  title="Cooling Load Report"
                  inputs={[
                    { label: 'Equipment Load', value: `${loadKw} kW` },
                    { label: 'Facility Size', value: `${sqFt} sq ft` },
                    { label: 'Ambient Temperature', value: `${ambientTemp} °F` },
                    { label: 'Target Temperature', value: `${targetTemp} °F` },
                    { label: 'Structure Type', value: `${STRUCTURE_COOLING_MULTIPLIERS[structureType]?.label ?? structureType} (${mult}x)` },
                    { label: 'Occupants', value: occupants },
                  ]}
                  results={[
                    { label: 'Equipment Heat', value: fmt(results.equipmentBtu, 0), unit: 'BTU/hr' },
                    { label: 'Envelope Heat Gain', value: fmt(results.envelopeBtu, 0), unit: 'BTU/hr' },
                    { label: 'Occupant Heat', value: fmt(results.occupantBtu, 0), unit: 'BTU/hr' },
                    { label: 'Total Heat Gain', value: fmt(results.totalBtu, 0), unit: 'BTU/hr' },
                    { label: 'Cooling Tonnage (before margin)', value: fmt(results.tons, 1), unit: 'tons' },
                    { label: 'Recommended (with 15% margin)', value: fmt(results.tonsWithMargin, 1), unit: 'tons' },
                  ]}
                  formulaSteps={describeCooling(inputs, results).map((s) => ({ label: s.label, result: s.result }))}
                  warnings={parseInt(occupants) === 0 ? ['Occupant heat not included — each person adds ~450 BTU/hr.'] : undefined}
                />
              }
              filename="cooling-load-report.pdf"
            />
          </div>
        </Card>
      )}
    </div>
  )
}
