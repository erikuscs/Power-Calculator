import { useCallback, useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { SelectField } from '../../components/ui/SelectField'
import { ResultGrid, ResultItem } from '../../components/ui/ResultDisplay'
import { PdfExportButton } from '../../components/pdf/PdfExportButton'
import { ReportContextFields } from '../../components/ui/ReportContextFields'
import { OneLineDiagramPanel } from '../../components/ui/OneLineDiagramPanel'
import { HybridSiteLayout3D } from '../../components/ui/HybridSiteLayout3D'
import { useCalculator } from '../../hooks/useCalculator'
import { VOLTAGE_OPTIONS } from '../../lib/constants'
import { fmt, fmtCurrency, fmtInt } from '../../lib/formatters'
import {
  ampsToRealKw,
  calculateHybridWizard,
  selectCompatibleBessPackage,
  type ElectricalPhase,
  type HybridWizardInputs,
} from './scenario.formulas'
import { buildHybridProjectPlan } from './hybridProjectPlan'
import { buildHybridOneLineDiagram } from './oneLineDiagram'

const EMPTY_ZONES: { id: string; name: string; kw: number }[] = []

function parsed(value: string) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export default function HybridEnergyWizard() {
  const [peakAmps, setPeakAmps] = useState('')
  const [continuousAmps, setContinuousAmps] = useState('')
  const [voltage, setVoltage] = useState('')
  const [phase, setPhase] = useState('')
  const [powerFactor, setPowerFactor] = useState('')
  const [bess28DayRate, setBess28DayRate] = useState('')
  const [generator28DayRate, setGenerator28DayRate] = useState('')
  const [clientName, setClientName] = useState('')
  const [projectName, setProjectName] = useState('')

  const peakA = parsed(peakAmps)
  const continuousA = parsed(continuousAmps)
  const siteVoltage = parsed(voltage)
  const pf = parsed(powerFactor)
  const electricalPhase = phase as ElectricalPhase
  const peakLoadKw = ampsToRealKw(peakA, siteVoltage, electricalPhase, pf)
  const baseLoadKw = ampsToRealKw(continuousA, siteVoltage, electricalPhase, pf)
  const compatibleBess = phase && siteVoltage > 0 && baseLoadKw > 0
    ? selectCompatibleBessPackage(baseLoadKw, siteVoltage, electricalPhase)
    : null
  const continuousError = continuousA > 0 && peakA > 0 && continuousA > peakA
    ? 'Continuous amps cannot exceed peak amps.'
    : undefined
  const compatibilityError = phase && siteVoltage > 0 && baseLoadKw > 0 && !compatibleBess
    ? 'No electrically compatible BESS in the governed five-model rental inventory. Do not force a substitute.'
    : undefined

  const inputs: HybridWizardInputs = {
    peakAmps: peakA,
    continuousAmps: continuousA,
    phase: electricalPhase,
    bess28DayRate: parsed(bess28DayRate),
    generator28DayRate: parsed(generator28DayRate),
    peakLoadKw,
    baseLoadKw,
    loadSource: 'measured',
    bessUnitSize: 5,
    peakHoursPerDay: 0,
    projectDurationDays: 28,
    redundancy: 'n',
    siteVoltage,
    altitude: 0,
    ambientTemp: 77,
    fuelCostPerGallon: 0,
    bessRentalPerDay: parsed(bess28DayRate) / 28,
    genRentalPerDay: parsed(generator28DayRate) / 28,
    bessRentalRate: parsed(bess28DayRate),
    bessRentalRatePeriod: 'monthly',
    genRentalRate: parsed(generator28DayRate),
    genRentalRatePeriod: 'monthly',
    startDate: '',
    endDate: '',
    motors: [],
    powerFactor: pf,
    loadVoltage: siteVoltage,
    loadPhase: electricalPhase || 'three',
    neutralPlan: 'review',
  }

  const calculate = useCallback((candidate: HybridWizardInputs) => {
    if (
      !candidate.phase
      || (candidate.peakAmps ?? 0) <= 0
      || (candidate.continuousAmps ?? 0) <= 0
      || (candidate.continuousAmps ?? 0) > (candidate.peakAmps ?? 0)
      || candidate.siteVoltage <= 0
      || (candidate.powerFactor ?? 0) <= 0
      || (candidate.powerFactor ?? 0) > 1
      || !selectCompatibleBessPackage(candidate.baseLoadKw, candidate.siteVoltage, candidate.phase)
    ) return null
    return calculateHybridWizard(candidate)
  }, [])

  const results = useCalculator(inputs, calculate)
  const projectPlan = results ? buildHybridProjectPlan(inputs, results, EMPTY_ZONES) : null
  const diagram = results ? buildHybridOneLineDiagram(inputs, results, EMPTY_ZONES) : null
  const pricingComplete = results ? results.bess28DayRate > 0 && results.generator28DayRate > 0 : false

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Hybrid Package Selector"
          subtitle="Enter the customer's measured electrical demand. EMaaS Pro chooses a compatible rental-market BESS and generator package without assuming runtime, fuel, zones, or redundancy."
          action={<a href="/examples/2000a-hybrid" className="text-sm font-bold text-signal-blue no-underline hover:text-text">View Live Example</a>}
        />
        <ReportContextFields clientName={clientName} projectName={projectName} onClientNameChange={setClientName} onProjectNameChange={setProjectName} />

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <InputField label="Peak Current" unit="A" value={peakAmps} onChange={setPeakAmps} min={0} required />
          <InputField label="Continuous Current" unit="A" value={continuousAmps} onChange={setContinuousAmps} min={0} required error={continuousError} />
          <SelectField label="Voltage" value={voltage} onChange={setVoltage} options={VOLTAGE_OPTIONS.map((option) => ({ ...option }))} placeholder="Select voltage" required />
          <SelectField label="Phase" value={phase} onChange={setPhase} options={[{ value: 'single', label: 'Single phase' }, { value: 'three', label: 'Three phase' }]} placeholder="Select phase" required />
          <InputField label="Power Factor" value={powerFactor} onChange={setPowerFactor} min={0.1} max={1} step="0.01" required />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField label="Selected BESS 28-Day Rate" unit="$/unit" value={bess28DayRate} onChange={setBess28DayRate} min={0} placeholder="Enter quoted rate" />
          <InputField label="Selected Generator 28-Day Rate" unit="$/unit" value={generator28DayRate} onChange={setGenerator28DayRate} min={0} placeholder="Enter quoted rate" />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-text-dim">Rates are one fixed 28-day rental cycle per selected unit. Blank rates remain TBD; EMaaS Pro does not invent vendor pricing.</p>

        {compatibilityError && <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-warning/35 bg-warning/10 p-3 text-sm text-warning"><AlertTriangle size={16} className="mt-0.5 shrink-0" /><span>{compatibilityError}</span></div>}
      </Card>

      {results && projectPlan && diagram && (
        <>
          <Card>
            <CardHeader
              title="Automatically Selected Package"
              subtitle="Selection is restricted to electrically compatible items in the governed rental inventory."
              action={<PdfExportButton createDocument={async () => { const { HybridEnergyPdfDoc } = await import('./HybridEnergyPdf'); return <HybridEnergyPdfDoc inputs={inputs} results={results} clientName={clientName} projectName={projectName} zones={EMPTY_ZONES} /> }} filename="emaas-hybrid-28-day-package.pdf" label="Generate 28-Day Report" />}
            />
            <ResultGrid>
              <ResultItem label="Peak Demand" value={fmt(peakA, 0)} unit="A" highlight />
              <ResultItem label="Continuous Demand" value={fmt(continuousA, 0)} unit="A" />
              <ResultItem label="Derived Peak" value={fmt(peakLoadKw, 1)} unit="kW" />
              <ResultItem label="Derived Continuous" value={fmt(baseLoadKw, 1)} unit="kW" />
              <ResultItem label="BESS Package" value={`${results.bessUnits} × ${results.bessUnitContinuousKw} kW`} highlight />
              <ResultItem label="Generator Package" value={`${results.genUnits} × ${results.genUnitSizeKw} kW`} />
              <ResultItem label="28-Day Equipment Total" value={pricingComplete ? fmtCurrency(results.equipment28DayTotal) : 'TBD'} highlight />
            </ResultGrid>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-signal-blue/35 bg-signal-blue/10 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-signal-blue"><CheckCircle2 size={16} /> Selected BESS</div>
                <p className="mt-2 text-sm font-semibold text-text">{results.bessUnits} × {results.selectedBessLabel}</p>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">{results.selectedBessSource}</p>
              </div>
              <div className="rounded-lg border border-accent-500/35 bg-accent-500/10 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-accent-300"><CheckCircle2 size={16} /> Selected Generator</div>
                <p className="mt-2 text-sm font-semibold text-text">{results.genUnits} × {results.selectedGeneratorLabel}</p>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">{results.selectedGeneratorSource}</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-text-muted">No standby unit, runtime duration, fuel consumption, fuel-reduction claim, or load zones are included. Add those only after the customer provides the missing operating requirements.</p>
          </Card>

          <OneLineDiagramPanel diagram={diagram} />
          <Card><HybridSiteLayout3D plan={projectPlan} /></Card>

          <Card>
            <CardHeader title="28-Day Quote Basis" subtitle="One rental cycle; distribution and engineering remain vendor scope." />
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-sg-600"><th className="py-2 text-left text-text-muted">Equipment</th><th className="py-2 text-right text-text-muted">Qty</th><th className="py-2 text-right text-text-muted">28-day rate</th><th className="py-2 text-right text-text-muted">Extended</th></tr></thead><tbody>{projectPlan.quoteItems.map((item) => <tr key={item.id} className="border-b border-sg-700"><td className="py-2 text-text">{item.description}</td><td className="py-2 text-right text-text">{fmtInt(item.quantity)}</td><td className="py-2 text-right text-text">{item.rate > 0 ? fmtCurrency(item.rate) : 'TBD'}</td><td className="py-2 text-right font-semibold text-text">{item.total > 0 ? fmtCurrency(item.total) : 'TBD'}</td></tr>)}</tbody></table></div>
            <div className="mt-4 text-right text-lg font-bold text-text">28-day equipment total: {pricingComplete ? fmtCurrency(projectPlan.budgetaryTotal) : 'TBD'}</div>
          </Card>
        </>
      )}
    </div>
  )
}
