import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { ResultItem, ResultGrid } from '../../components/ui/ResultDisplay'
import { FormulaBreakdown } from '../../components/ui/FormulaBreakdown'
import { EquipmentRecommendationPanel } from '../../components/ui/EquipmentRecommendationPanel'
import { PdfExportButton } from '../../components/pdf/PdfExportButton'
import { HistoryDrawer } from '../../components/ui/HistoryDrawer'
import { useCalculator } from '../../hooks/useCalculator'
import { usePersistedState } from '../../hooks/usePersistedState'
import { useUrlState } from '../../hooks/useUrlState'
import { useLocation } from 'react-router-dom'
import { useCalculationHistory } from '../../hooks/useCalculationHistory'
import { fmt } from '../../lib/formatters'
import { recommendEquipment } from '../../lib/equipmentRecommendations'
import {
  calculateRuntime,
  describeRuntime,
  type RuntimeInputs,
  type RuntimeResults,
} from './bess.formulas'

const ROUTE_KEY = '/bess/runtime-v2'

export default function BessRuntimePage() {
  const location = useLocation()
  const legacyLinkDetected = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return ['v', 'a', 'pf'].some((key) => params.has(key))
  }, [location.search])
  // Persisted defaults (localStorage fallback)
  const [persistedKwh, setPersistedKwh] = usePersistedState(ROUTE_KEY, 'kwh', '60')
  const [persistedLoadKw, setPersistedLoadKw] = usePersistedState(ROUTE_KEY, 'loadKw', '10')
  const [persistedUsablePercent, setPersistedUsablePercent] = usePersistedState(ROUTE_KEY, 'usablePercent', '80')
  const [persistedEfficiencyPercent, setPersistedEfficiencyPercent] = usePersistedState(ROUTE_KEY, 'efficiencyPercent', '95')

  // URL state takes priority over persisted defaults
  const [kWh, setKWhUrl] = useUrlState('kwh', persistedKwh)
  const [loadKw, setLoadKwUrl] = useUrlState('loadKw', persistedLoadKw)
  const [usablePercent, setUsablePercentUrl] = useUrlState('usable', persistedUsablePercent)
  const [efficiencyPercent, setEfficiencyPercentUrl] = useUrlState('efficiency', persistedEfficiencyPercent)

  // Sync changes to both URL and localStorage
  const setKWh = useCallback((v: string) => { setKWhUrl(v); setPersistedKwh(v) }, [setKWhUrl, setPersistedKwh])
  const setLoadKw = useCallback((v: string) => { setLoadKwUrl(v); setPersistedLoadKw(v) }, [setLoadKwUrl, setPersistedLoadKw])
  const setUsablePercent = useCallback((v: string) => { setUsablePercentUrl(v); setPersistedUsablePercent(v) }, [setUsablePercentUrl, setPersistedUsablePercent])
  const setEfficiencyPercent = useCallback((v: string) => { setEfficiencyPercentUrl(v); setPersistedEfficiencyPercent(v) }, [setEfficiencyPercentUrl, setPersistedEfficiencyPercent])

  // Calculation history
  const { entries, addEntry, clearHistory } = useCalculationHistory<RuntimeInputs>(ROUTE_KEY)

  const inputs: RuntimeInputs = useMemo(() => ({
    kWh: parseFloat(kWh) || 0,
    loadKw: parseFloat(loadKw) || 0,
    usablePercent: parseFloat(usablePercent) || 0,
    efficiencyPercent: parseFloat(efficiencyPercent) || 0,
  }), [kWh, loadKw, usablePercent, efficiencyPercent])

  const calculate = useCallback(
    (i: RuntimeInputs): RuntimeResults | null => {
      if (i.kWh <= 0 || i.loadKw <= 0 || i.usablePercent <= 0 || i.usablePercent > 100 || i.efficiencyPercent <= 0 || i.efficiencyPercent > 100) return null
      return calculateRuntime(i)
    },
    [],
  )

  const results = useCalculator(inputs, calculate)
  const validationMessage = inputs.kWh <= 0 || inputs.loadKw <= 0
    ? 'Battery capacity and continuous load must both be greater than zero.'
    : inputs.usablePercent <= 0 || inputs.usablePercent > 100
      ? 'Usable energy window must be greater than 0% and no more than 100%.'
      : inputs.efficiencyPercent <= 0 || inputs.efficiencyPercent > 100
        ? 'Delivery efficiency must be greater than 0% and no more than 100%.'
        : null
  const recommendation = results
    ? recommendEquipment({
        peakKw: inputs.loadKw,
        runtimeHours: results.runtime,
      })
    : null

  // Auto-save to history when results change
  const prevResultRef = useRef<string | null>(null)
  useEffect(() => {
    if (!results) return
    const key = `${inputs.kWh}-${inputs.loadKw}-${inputs.usablePercent}-${inputs.efficiencyPercent}`
    if (key === prevResultRef.current) return
    prevResultRef.current = key
    const label = `${inputs.kWh} kWh, ${inputs.loadKw} kW continuous → ${fmt(results.runtime, 1)} hrs`
    addEntry(inputs, label)
  }, [results, inputs, addEntry])

  const handleRestore = useCallback((restored: RuntimeInputs) => {
    setKWh(String(restored.kWh))
    setLoadKw(String(restored.loadKw))
    setUsablePercent(String(restored.usablePercent))
    setEfficiencyPercent(String(restored.efficiencyPercent))
  }, [setKWh, setLoadKw, setUsablePercent, setEfficiencyPercent])

  const steps = results ? describeRuntime(inputs, results) : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="BESS Runtime Calculator"
          subtitle="Estimate runtime from usable energy and verified continuous load"
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
          <InputField
            label="Continuous Load"
            unit="kW"
            value={loadKw}
            onChange={setLoadKw}
            min={0}
            tooltip="Verified continuous real-power demand. Do not use momentary peak or inrush kW."
          />
          <InputField
            label="Usable Energy Window"
            unit="%"
            value={usablePercent}
            onChange={setUsablePercent}
            min={0}
            max={100}
            tooltip="Share of nameplate energy available between the operating SOC limits"
          />
          <InputField
            label="Delivery Efficiency"
            unit="%"
            value={efficiencyPercent}
            onChange={setEfficiencyPercent}
            min={0}
            max={100}
            tooltip="Battery-to-load conversion efficiency after parasitic and inverter losses"
          />
        </div>

        {validationMessage && (
          <div role="alert" className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {validationMessage}
          </div>
        )}
        {legacyLinkDetected && (
          <div role="alert" className="mb-6 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
            This legacy runtime link used voltage, current, or power factor. Re-enter the verified continuous kW load, usable SOC window, and delivery efficiency for the corrected energy calculation.
          </div>
        )}

        {results && (
          <>
            <ResultGrid>
              <ResultItem
                label="Delivered Energy"
                value={fmt(results.deliveredEnergyKwh, 1)}
                unit="kWh"
              />
              <ResultItem
                label="Estimated Runtime"
                value={fmt(results.runtime, 1)}
                unit="hrs"
                highlight
              />
            </ResultGrid>

            <FormulaBreakdown steps={steps} />
            {recommendation && (
              <div className="mt-6">
                <EquipmentRecommendationPanel recommendation={recommendation} />
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <PdfExportButton
                createDocument={async () => {
                  const { BessRuntimePdfDoc } = await import('./BessRuntimePdf')
                  return <BessRuntimePdfDoc inputs={inputs} results={results} />
                }}
                filename="bess-runtime-report.pdf"
              />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
