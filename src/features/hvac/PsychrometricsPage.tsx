import { useState, useCallback } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { useCalculator } from '../../hooks/useCalculator'
import { calculateAirsideTonnage, describeAirsideTonnage, type AirsideTonnageInputs } from './hvac.formulas'
import { fmt } from '../../lib/formatters'

export default function PsychrometricsPage() {
  const [cfm, setCfm] = useState('10000')
  const [inletDb, setInletDb] = useState('95')
  const [inletWb, setInletWb] = useState('78')
  const [outletDb, setOutletDb] = useState('55')
  const [outletWb, setOutletWb] = useState('54')

  const inputs: AirsideTonnageInputs = {
    cfm: parseFloat(cfm) || 0,
    inletDryBulb: parseFloat(inletDb) || 0,
    inletWetBulb: parseFloat(inletWb) || 0,
    outletDryBulb: parseFloat(outletDb) || 0,
    outletWetBulb: parseFloat(outletWb) || 0,
  }

  const calculate = useCallback((inp: AirsideTonnageInputs) => calculateAirsideTonnage(inp), [])
  const results = useCalculator(inputs, calculate)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader title="Psychrometrics — Airside Tonnage" subtitle="Calculate sensible, latent, and total cooling from airflow conditions" />
        <div className="space-y-4">
          <InputField label="Air Flow" unit="CFM" value={cfm} onChange={setCfm} required tooltip="Volume of air moving through ducts" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-accent-400">Inlet Conditions</h3>
              <InputField label="Dry Bulb" unit="°F" value={inletDb} onChange={setInletDb} required />
              <InputField label="Wet Bulb" unit="°F" value={inletWb} onChange={setInletWb} required />
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-accent-400">Outlet Conditions</h3>
              <InputField label="Dry Bulb" unit="°F" value={outletDb} onChange={setOutletDb} required />
              <InputField label="Wet Bulb" unit="°F" value={outletWb} onChange={setOutletWb} required />
            </div>
          </div>
        </div>
      </Card>

      {results && (
        <Card>
          <CardHeader title="Results" />
          <ResultGrid>
            <ResultItem label="Total Cooling" value={fmt(results.totalCoolingBtu, 0)} unit="BTU/hr" />
            <ResultItem label="Tonnage" value={fmt(results.tonnage, 1)} unit="tons" highlight />
            <ResultItem label="Sensible Cooling" value={fmt(results.sensibleCoolingBtu, 0)} unit="BTU/hr" />
            <ResultItem label="Latent Cooling" value={fmt(results.latentCoolingBtu, 0)} unit="BTU/hr" />
            <ResultItem label="Inlet Enthalpy" value={fmt(results.inletEnthalpy, 2)} unit="kJ/kg" />
            <ResultItem label="Outlet Enthalpy" value={fmt(results.outletEnthalpy, 2)} unit="kJ/kg" />
          </ResultGrid>
          <FormulaBreakdown steps={describeAirsideTonnage(inputs, results)} />
        </Card>
      )}
    </div>
  )
}
