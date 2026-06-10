import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Battery, Plug, Thermometer, Zap, Workflow, Droplets, Lightbulb, Gauge, ArrowLeftRight, Wind, Fuel, BarChart3 } from 'lucide-react'
import { APP_BRAND } from '../../lib/brand'
import {
  EMAAS_FIELD_MODES,
  EMAAS_OPERATING_VARIABLES,
  EMAAS_OUTCOME_METRICS,
  EMAAS_POSITIONING,
  type EmaasOperatingVariable,
  type EmaasOutcomeMetric,
} from '../../lib/emaas'

const scenarios = [
  { to: '/scenarios/temp-power', icon: Zap, title: 'Temp Power & Cooling', desc: 'Emergency EMaaS sizing with load capture and equipment planning', accent: true },
  { to: '/scenarios/hybrid-energy', icon: Workflow, title: 'Hybrid EMaaS Strategy', desc: 'Design BESS + generator systems for commissioning blocks and redundant sites', accent: true },
  { to: '/scenarios/bess-project', icon: BarChart3, title: 'BESS Project Economics', desc: 'System sizing, revenue projections, and ROI analysis', accent: true },
  { to: '/scenarios/hvac-assessment', icon: Thermometer, title: 'Cooling Load Strategy', desc: 'Cooling load, chiller sizing, and airside analysis', accent: true },
]

const bessCalcs = [
  { to: '/bess/runtime', icon: Battery, title: 'BESS Runtime', desc: 'Battery runtime from kWh, voltage, amps, and power factor' },
  { to: '/bess/sizing', icon: Battery, title: 'Multi-Unit Sizing', desc: 'How many BESS units for your load and duration' },
  { to: '/bess/roi', icon: Battery, title: 'Revenue / ROI', desc: 'Arbitrage, demand reduction, NPV, and payback analysis' },
]

const powerCalcs = [
  { to: '/power/general', icon: Plug, title: 'General Power', desc: 'P = V × I × PF for single and three-phase' },
  { to: '/power/amperes', icon: Gauge, title: 'Amperes', desc: 'Calculate amps from kW, voltage, and power factor' },
  { to: '/power/kw-kva', icon: ArrowLeftRight, title: 'kW ↔ kVA', desc: 'Convert between real and apparent power' },
  { to: '/power/generator', icon: Zap, title: 'Generator Power', desc: 'Size generators with 125% safety margin' },
  { to: '/power/fuel', icon: Fuel, title: 'Fuel Consumption', desc: 'Load-dependent BSFC with altitude and temp derating' },
  { to: '/power/lumens', icon: Lightbulb, title: 'Lumens & Watts', desc: 'Lighting power from lumens and lamp type' },
]

const hvacCalcs = [
  { to: '/hvac/cooling', icon: Thermometer, title: 'Cooling Load', desc: 'Equipment + envelope + occupant heat → tonnage' },
  { to: '/hvac/chiller', icon: Droplets, title: 'Chiller Sizing', desc: 'GPM, ΔT, specific heat → tonnage' },
  { to: '/hvac/psychrometrics', icon: Wind, title: 'Psychrometrics', desc: 'Airside tonnage — sensible, latent, and total' },
]

interface CalcItem {
  to: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  desc: string
  accent?: boolean
}

function CalcGrid({ title, items }: { title: string; items: CalcItem[] }) {
  return (
    <div>
      <h2 className="text-[10px] font-bold text-text-dim uppercase tracking-[0.15em] mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Link key={item.to} to={item.to} className="no-underline">
            <Card className={`hover:border-accent-500/40 transition-all h-full ${item.accent ? 'border-l-3 border-l-accent-500' : ''}`}>
              <item.icon size={20} className="text-accent-500 mb-3" />
              <h3 className="text-sm font-bold text-text mb-1 tracking-tight">{item.title}</h3>
              <p className="text-xs text-text-dim leading-relaxed">{item.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

const metricTone: Record<EmaasOutcomeMetric['tone'], string> = {
  gold: 'border-accent-500/35 bg-accent-500/10 text-accent-300',
  blue: 'border-signal-blue/35 bg-signal-blue/10 text-signal-blue',
  coral: 'border-coral-500/35 bg-coral-500/10 text-coral-400',
  slate: 'border-steel-400/30 bg-steel-400/10 text-steel-400',
}

function OutcomeMetric({ metric }: { metric: EmaasOutcomeMetric }) {
  return (
    <div className={`rounded-lg border px-4 py-4 ${metricTone[metric.tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <metric.icon size={18} />
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-dim">{metric.label}</span>
      </div>
      <div className="mt-4 text-2xl font-bold text-text">{metric.value}</div>
      <p className="mt-1 text-xs leading-relaxed text-text-muted">{metric.context}</p>
    </div>
  )
}

function OperatingVariable({ item }: { item: EmaasOperatingVariable }) {
  return (
    <div className="flex gap-3 rounded-lg border border-sg-600/40 bg-sg-800/65 p-4">
      <item.icon size={17} className="mt-0.5 shrink-0 text-accent-400" />
      <div>
        <h3 className="text-sm font-bold text-text">{item.label}</h3>
        <p className="mt-1 text-xs leading-relaxed text-text-muted">{item.detail}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <div className="flex flex-col justify-between rounded-lg border border-sg-600/40 bg-sg-800/70 p-6 md:p-7">
          <div>
            <p className="text-[10px] font-bold text-accent-400 uppercase tracking-[0.15em] mb-3">{APP_BRAND.descriptor}</p>
            <h1 className="text-3xl font-bold text-text tracking-tight md:text-4xl">{APP_BRAND.suiteName}</h1>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-text-muted">
              {EMAAS_POSITIONING}
            </p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 text-xs text-text-muted sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <span className="rounded-lg border border-sg-600/50 px-3 py-2">{APP_BRAND.domain}</span>
            <span className="rounded-lg border border-sg-600/50 px-3 py-2">Data center centric</span>
            <span className="rounded-lg border border-sg-600/50 px-3 py-2">Report ready</span>
            <span className="rounded-lg border border-sg-600/50 px-3 py-2">Engineer review</span>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-sg-600/40 bg-sg-800">
          <img
            src="/media/emaas-data-center-ops.webp"
            alt="Data center energy operations model with BESS, generators, cooling, switchgear, and telemetry"
            className="h-full min-h-72 w-full object-cover"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {EMAAS_OUTCOME_METRICS.map((metric) => (
          <OutcomeMetric key={metric.label} metric={metric} />
        ))}
      </section>

      <CalcGrid title="EMaaS Workflows - What are you managing today?" items={scenarios} />

      <section>
        <h2 className="text-[10px] font-bold text-text-dim uppercase tracking-[0.15em] mb-4">Operating Variables Covered</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {EMAAS_OPERATING_VARIABLES.map((item) => (
            <OperatingVariable key={item.label} item={item} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[10px] font-bold text-text-dim uppercase tracking-[0.15em] mb-4">Commercial Use Cases</h2>
        <div className="flex flex-wrap gap-2">
          {EMAAS_FIELD_MODES.map((mode) => (
            <span key={mode} className="rounded-lg border border-sg-600/50 bg-sg-800/55 px-3 py-2 text-xs text-text-muted">
              {mode}
            </span>
          ))}
        </div>
      </section>

      <CalcGrid title="BESS (Battery Energy Storage)" items={bessCalcs} />
      <CalcGrid title="Electrical Power" items={powerCalcs} />
      <CalcGrid title="HVAC / Cooling" items={hvacCalcs} />
    </div>
  )
}
