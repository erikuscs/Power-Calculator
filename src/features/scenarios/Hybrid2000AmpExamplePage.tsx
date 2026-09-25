import { Download, ShieldCheck, Zap } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { PrintableOneLine } from '../../components/ui/OneLineDiagramPanel'
import { HybridSiteLayout3D } from '../../components/ui/HybridSiteLayout3D'
import { buildHybrid2000AmpExample, HYBRID_2000A_PROTECTED_KW, HYBRID_2000A_SERVICE_KVA } from './hybrid2000AmpExample'

const example = buildHybrid2000AmpExample()

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="border-b border-sg-600/35 py-3 last:border-b-0">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-dim">{label}</div>
      <div className="mt-1 text-xl font-bold text-text">{value}</div>
      {detail && <div className="mt-1 text-xs leading-relaxed text-text-muted">{detail}</div>}
    </div>
  )
}

export default function Hybrid2000AmpExamplePage() {
  const { results, diagram, plan } = example
  const allOnlineHeadroom = results.genCapacityKw - HYBRID_2000A_PROTECTED_KW
  const firmHeadroom = results.generatorFirmCapacityKw - HYBRID_2000A_PROTECTED_KW

  return (
    <div className="hybrid-example-report mx-auto max-w-[1500px] space-y-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent-400">Verified worked example</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-text">2,000 A Hybrid Service — Linked Plan + One-Line</h1>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-text-muted">
            480 V, three-phase temporary-power architecture sized from the service rating at 0.80 power factor. The service basis is deliberately conservative until measured load is available.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-accent-500/45 bg-accent-500/10 px-4 py-2.5 text-sm font-bold text-accent-300 hover:bg-accent-500/20">
            <Download size={16} /> Print / Save PDF
          </button>
          <span className="inline-flex items-center gap-2 rounded-lg border border-signal-blue/35 bg-signal-blue/10 px-4 py-2.5 text-sm font-bold text-signal-blue">
            <ShieldCheck size={16} /> PE verification required
          </span>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 space-y-4">
          <Card className="overflow-hidden p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
              <div>
                <h2 className="text-base font-bold text-text">Electrical One-Line Diagram</h2>
                <p className="text-xs text-text-muted">Recognized one-line symbols; no transformer is shown because source and service are both 480 V.</p>
              </div>
              <span className="rounded border border-sg-600/45 bg-sg-900 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">Conceptual · not for construction</span>
            </div>
            <PrintableOneLine diagram={diagram} compact showNotes={false} />
          </Card>

          <Card className="overflow-hidden p-3">
            <HybridSiteLayout3D plan={plan} compact />
          </Card>
        </section>

        <aside className="space-y-4">
          <Card>
            <div className="mb-1 flex items-center gap-2">
              <Zap size={17} className="text-accent-400" />
              <h2 className="text-base font-bold text-text">Sizing Summary</h2>
            </div>
            <Metric label="Service basis" value="2,000 A" detail={`${HYBRID_2000A_SERVICE_KVA.toFixed(1)} kVA at 480 V, 3-phase`} />
            <Metric label="Protected real-power basis" value={`${HYBRID_2000A_PROTECTED_KW.toFixed(1)} kW`} detail="0.80 planning power factor; replace with measured demand when available" />
            <Metric label="Generation" value={`${results.genUnits} × ${results.genUnitSizeKw} kW`} detail={`${results.generatorRequiredUnits} duty + ${results.generatorStandbyUnits} standby · ${results.generatorFirmCapacityKw.toLocaleString()} kW firm`} />
            <Metric label="BESS" value={`${results.bessUnits} × ${results.bessUnitContinuousKw} kW`} detail={`${results.bessRequiredUnits} duty + ${results.bessStandbyUnits} standby · ${results.bessFirmCapacityKw.toLocaleString()} kW firm continuous`} />
            <Metric label="DEIF recharge ceiling" value={`${firmHeadroom.toFixed(1)} kW firm`} detail={`${allOnlineHeadroom.toFixed(1)} kW with all four generators online; staged charging only`} />
          </Card>

          <div className="rounded-lg border border-signal-blue/35 bg-signal-blue/10 p-4 text-xs leading-relaxed text-text-muted">
            <div className="font-bold text-signal-blue">Why this is modular</div>
            <p className="mt-2">One generator or one BESS unit may be unavailable while the remaining source plant still carries the 1,330.2 kW protected service basis. DEIF dispatch limits recharge to headroom after customer load.</p>
          </div>
          <div className="rounded-lg border border-warning/35 bg-warning/10 p-4 text-xs leading-relaxed text-text-muted">
            <div className="font-bold text-warning">Known boundary</div>
            <p className="mt-2">A 2,000 A breaker is not proof of actual demand. This example sizes the requested service conservatively and does not claim fuel reduction without measured load telemetry.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
