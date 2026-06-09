import { useCallback, useEffect, useRef } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { SelectField } from '../../components/ui/SelectField'
import { RadioGroup } from '../../components/ui/RadioGroup'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { PdfExportButton } from '../../components/pdf/PdfExportButton'
import { HistoryDrawer } from '../../components/ui/HistoryDrawer'
import { BessRuntimePdfDoc } from './BessRuntimePdf'
import { useCalculator } from '../../hooks/useCalculator'
import { usePersistedState } from '../../hooks/usePersistedState'
import { useUrlState } from '../../hooks/useUrlState'
import { useCalculationHistory } from '../../hooks/useCalculationHistory'
import { fmt } from '../../lib/formatters'
import {
  calculateRuntime,
  describeRuntime,
  type RuntimeInputs,
  type RuntimeResults,
} from './bess.formulas'

const ROUTE_KEY = '/bess/runtime'

const VOLTAGE_OPTIONS = [
  { value: '12', label: '12 V' },
  { value: '24', label: '24 V' },
  { value: '48', label: '48 V' },
  { value: '96', label: '96 V' },
  { value: '120', label: '120 V' },
  { value: '240', label: '240 V' },
  { value: '480', label: '480 V' },
]

const POWER_FACTOR_OPTIONS = [
  { value: '0.8', label: '0.8 (Typical)' },
  { value: '1.0', label: '1.0 (Resistive)' },
]

export default function BessRuntimePage() {
  // Persisted defaults (localStorage fallback)
  const [persistedKwh, setPersistedKwh] = usePersistedState(ROUTE_KEY, 'kwh', '60')
  const [persistedVoltage, setPersistedVoltage] = usePersistedState(ROUTE_KEY, 'voltage', '48')
  const [persistedAmps, setPersistedAmps] = usePersistedState(ROUTE_KEY, 'amps', '50')
  const [persistedPf, setPersistedPf] = usePersistedState(ROUTE_KEY, 'pf', '0.8')

  // URL state takes priority over persisted defaults
  const [kWh, setKWhUrl] = useUrlState('kwh', persistedKwh)
  const [voltage, setVoltageUrl] = useUrlState('v', persistedVoltage)
  const [amps, setAmpsUrl] = useUrlState('a', persistedAmps)
  const [powerFactor, setPfUrl] = useUrlState('pf', persistedPf)

  // Sync changes to both URL and localStorage
  const setKWh = useCallback((v: string) => { setKWhUrl(v); setPersistedKwh(v) }, [setKWhUrl, setPersistedKwh])
  const setVoltage = useCallback((v: string) => { setVoltageUrl(v); setPersistedVoltage(v) }, [setVoltageUrl, setPersistedVoltage])
  const setAmps = useCallback((v: string) => { setAmpsUrl(v); setPersistedAmps(v) }, [setAmpsUrl, setPersistedAmps])
  const setPowerFactor = useCallback((v: string) => { setPfUrl(v); setPersistedPf(v) }, [setPfUrl, setPersistedPf])

  // Calculation history
  const { entries, addEntry, clearHistory } = useCalculationHistory<RuntimeInputs>(ROUTE_KEY)

  const inputs: RuntimeInputs = {
    kWh: parseFloat(kWh) || 0,
    voltage: parseFloat(voltage) || 0,
    amps: parseFloat(amps) || 0,
    powerFactor: parseFloat(powerFactor) || 0.8,
  }

  const calculate = useCallback(
    (i: RuntimeInputs): RuntimeResults | null => {
      if (i.kWh <= 0 || i.voltage <= 0 || i.amps <= 0) return null
      return calculateRuntime(i)
    },
    [],
  )

  const results = useCalculator(inputs, calculate)

  // Auto-save to history when results change
  const prevResultRef = useRef<string | null>(null)
  useEffect(() => {
    if (!results) return
    const key = `${inputs.kWh}-${inputs.voltage}-${inputs.amps}-${inputs.powerFactor}`
    if (key === prevResultRef.current) return
    prevResultRef.current = key
    const label = `${inputs.kWh} kWh, ${inputs.voltage}V, ${inputs.amps}A, PF ${inputs.powerFactor} → ${fmt(results.runtime, 1)} hrs`
    addEntry(inputs, label)
  }, [results, inputs, addEntry])

  const handleRestore = useCallback((restored: RuntimeInputs) => {
    setKWh(String(restored.kWh))
    setVoltage(String(restored.voltage))
    setAmps(String(restored.amps))
    setPowerFactor(String(restored.powerFactor))
  }, [setKWh, setVoltage, setAmps, setPowerFactor])

  const steps = results ? describeRuntime(inputs, results) : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="BESS Runtime Calculator"
          subtitle="Estimate battery runtime based on capacity, voltage, and load"
          action={
            <HistoryDrawer
              entries={entries}
              onRestore={handleRestore}
              onClear={clearHistory}
            />
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <InputField
            label="Battery Capacity"
            unit="kWh"
            value={kWh}
            onChange={setKWh}
            min={0}
            tooltip="Total energy capacity of the BESS"
          />
          <SelectField
            label="System Voltage"
            unit="V"
            value={voltage}
            onChange={setVoltage}
            options={VOLTAGE_OPTIONS}
            tooltip="Nominal DC bus voltage"
          />
          <InputField
            label="Load Current"
            unit="A"
            value={amps}
            onChange={setAmps}
            min={0}
            tooltip="Average continuous load in amperes"
          />
          <RadioGroup
            label="Power Factor"
            value={powerFactor}
            onChange={setPowerFactor}
            options={POWER_FACTOR_OPTIONS}
          />
        </div>

        {results && (
          <>
            <ResultGrid>
              <ResultItem
                label="Amp-Hours"
                value={fmt(results.ampHours, 1)}
                unit="Ah"
              />
              <ResultItem
                label="Estimated Runtime"
                value={fmt(results.runtime, 1)}
                unit="hrs"
                highlight
              />
            </ResultGrid>

            <FormulaBreakdown steps={steps} />

            <div className="mt-4 flex justify-end">
              <PdfExportButton
                document={<BessRuntimePdfDoc inputs={inputs} results={results} />}
                filename="bess-runtime-report.pdf"
              />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
