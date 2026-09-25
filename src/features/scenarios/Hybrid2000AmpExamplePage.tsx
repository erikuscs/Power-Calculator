import { Download, ShieldCheck, Zap } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { PrintableOneLine } from '../../components/ui/OneLineDiagramPanel'
import { HybridSiteLayout3D } from '../../components/ui/HybridSiteLayout3D'
import { buildHybrid2000AmpExample, HYBRID_2000A_CONTINUOUS_AMPS, HYBRID_2000A_CONTINUOUS_KW, HYBRID_2000A_PROTECTED_KW, HYBRID_2000A_SERVICE_KVA } from './hybrid2000AmpExample'

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
  const rechargeHeadroom = results.generatorFirmCapacityKw - HYBRID_2000A_PROTECTED_KW

  return (
    <div className="hybrid-example-report mx-auto max-w-[1500px] space-y-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent-400">Verified worked example</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-text">2,000 A Hybrid Service — Linked Plan + One-Line</h1>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-text-muted">
            Construction base-camp hybrid sized from a 2,000 A peak and 500 A continuous request at 480 V, three-phase. Ten 240 V single-phase trailer connection points are shown without inventing unprovided trailer loads.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden" data-artifact-actions>
          <a href="/examples/EMAAS-Pro-2000A-Hybrid-Linked-Plan.pdf" className="inline-flex items-center gap-2 rounded-lg border border-signal-blue/40 bg-signal-blue/10 px-4 py-2.5 text-sm font-bold text-signal-blue no-underline hover:bg-signal-blue/15">
            <Download size={16} /> Download Controlled PDF
          </a>
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
          <div data-artifact-section="one-line">
          <Card className="overflow-hidden p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
              <div>
                <h2 className="text-base font-bold text-text">Electrical One-Line Diagram</h2>
                <p className="text-xs text-text-muted">Recognized one-line symbols with 480 V generation, DEIF controls, step-down transformation, and ten field-verified 240 V single-phase connection points.</p>
              </div>
              <span className="rounded border border-sg-600/45 bg-sg-900 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">Conceptual · not for construction</span>
            </div>
            <PrintableOneLine diagram={diagram} compact showNotes={false} />
          </Card>
          </div>

          <div data-artifact-section="site-layout">
          <Card className="overflow-hidden p-3">
            <HybridSiteLayout3D plan={plan} compact />
          </Card>
          </div>
        </section>

        <aside className="space-y-4" data-artifact-section="summary">
          <Card>
            <div className="mb-1 flex items-center gap-2">
              <Zap size={17} className="text-accent-400" />
              <h2 className="text-base font-bold text-text">Sizing Summary</h2>
            </div>
            <Metric label="Service basis" value="2,000 A" detail={`${HYBRID_2000A_SERVICE_KVA.toFixed(1)} kVA at 480 V, 3-phase`} />
            <Metric label="Continuous basis" value={`${HYBRID_2000A_CONTINUOUS_AMPS} A / ${HYBRID_2000A_CONTINUOUS_KW.toFixed(1)} kW`} detail="Derived using the entered 0.80 power factor" />
            <Metric label="Protected peak basis" value={`${HYBRID_2000A_PROTECTED_KW.toFixed(1)} kW`} detail="Generator and BESS ratings are not added as customer demand" />
            <Metric label="Generation" value={`${results.genUnits} × ${results.genUnitSizeKw} kW`} detail={`${results.generatorRequiredUnits} duty + ${results.generatorStandbyUnits} standby · ${results.generatorFirmCapacityKw.toLocaleString()} kW firm`} />
            <Metric label="BESS" value={`${results.bessUnits} × ${results.bessUnitContinuousKw} kW`} detail={`${results.bessRequiredUnits} duty + ${results.bessStandbyUnits} standby · ${results.bessFirmCapacityKw.toLocaleString()} kW firm continuous`} />
            <Metric label="Rental estimate basis" value="One 28-day cycle" detail="Enter one 28-day rate for each selected BESS and generator in the Hybrid Selector; no daily rental rate is inferred" />
            <Metric label="Source conductors" value="5 × 400 A runs/phase" detail="Main source schedule only; branch conductors remain withheld until trailer nameplates and locations are provided" />
            <Metric label="DEIF recharge ceiling" value={`${rechargeHeadroom.toFixed(1)} kW`} detail="Available while the generator plant carries the full requested peak; staged charging only" />
          </Card>

          <div className="rounded-lg border border-signal-blue/35 bg-signal-blue/10 p-4 text-xs leading-relaxed text-text-muted">
            <div className="font-bold text-signal-blue">Automatic rental-fleet selection</div>
            <p className="mt-2">EMaaS Pro compares all five governed BESS options and selects two Atlas Copco ZBC 250-575 units for 500 kW continuous capacity. Three 500 kW generators carry the 1,330.2 kW protected peak and retain controlled recharge headroom.</p>
          </div>
          <div className="rounded-lg border border-warning/35 bg-warning/10 p-4 text-xs leading-relaxed text-text-muted">
            <div className="font-bold text-warning">Known boundary</div>
            <p className="mt-2">Individual trailer nameplates and locations were not provided. The one-line shows ten connection points, but per-trailer kW, branch current, conductor quantity, and phase assignment remain withheld until field verification.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
