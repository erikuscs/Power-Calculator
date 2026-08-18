import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import {
  ArrowRight,
  Battery,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileText,
  Plug,
  Thermometer,
  Workflow,
  Zap,
} from 'lucide-react'

const startSteps = [
  {
    title: 'Define the job',
    body: 'Start with the real field problem: temporary power, hybrid energy, BESS economics, or cooling load.',
  },
  {
    title: 'Enter known site data',
    body: 'Use measured values when you have them. When a field value is unknown, choose the neutral or field-verify option.',
  },
  {
    title: 'Read the spec summary',
    body: 'Start with the streamlined spec: recommended setup, footprint, operating path, and confidence label.',
  },
  {
    title: 'Inspect the details',
    body: 'Use the sizing results, 24/7 coverage scenarios, one-line, and risk review to challenge the recommendation.',
  },
  {
    title: 'Export for review',
    body: 'Generate the report after the assumptions are clean, then send it for engineering or commercial review.',
  },
]

const primaryWorkflows = [
  {
    to: '/scenarios/temp-power',
    icon: Zap,
    title: 'Temporary Power',
    desc: 'Start with standalone generator sizing, then add cooling only when the job requires it.',
  },
  {
    to: '/scenarios/hybrid-energy',
    icon: Workflow,
    title: 'Hybrid EMaaS Strategy',
    desc: 'Use when the answer may combine generators, BESS, redundancy, and rate-period planning.',
  },
  {
    to: '/scenarios/bess-project',
    icon: Battery,
    title: 'BESS Project Evaluation',
    desc: 'Use for standalone BESS sizing, economics, revenue, payback, and footprint planning.',
  },
  {
    to: '/scenarios/hvac-assessment',
    icon: Thermometer,
    title: 'HVAC Load Assessment',
    desc: 'Use when cooling load, airflow, chiller sizing, and heat rejection are the main questions.',
  },
]

const referenceGroups = [
  {
    group: 'Electrical Power',
    icon: Plug,
    intro: 'Use these when you need to convert or verify the load before sizing equipment.',
    items: [
      { to: '/power/general', label: 'General Power', desc: 'Single-phase and three-phase power from voltage, current, and power factor.' },
      { to: '/power/kw-kva', label: 'kW vs kVA', desc: 'Real power, apparent power, and why power factor changes generator sizing.' },
      { to: '/power/generator', label: 'Generator Sizing', desc: 'Generator planning with margin, voltage, phase, and recommended equipment.' },
      { to: '/power/fuel', label: 'Fuel Consumption', desc: 'Fuel burn estimates adjusted for load, altitude, and temperature.' },
    ],
  },
  {
    group: 'BESS',
    icon: Battery,
    intro: 'Use these when runtime, capacity, degradation, or project value drives the decision.',
    items: [
      { to: '/bess/runtime', label: 'BESS Runtime', desc: 'Runtime from usable energy, load, voltage, amps, and power factor.' },
      { to: '/bess/sizing', label: 'Multi-Unit Sizing', desc: 'Unit count, usable capacity, reserve, and Sunbelt-style BESS selections.' },
      { to: '/bess/roi', label: 'Revenue / ROI', desc: 'Arbitrage, demand reduction, payback, and net present value.' },
    ],
  },
  {
    group: 'HVAC',
    icon: Thermometer,
    intro: 'Use these when the site problem is heat, airflow, water flow, or chiller capacity.',
    items: [
      { to: '/hvac/cooling', label: 'Cooling Load', desc: 'Equipment, envelope, occupancy, and safety factor translated to tons.' },
      { to: '/hvac/chiller', label: 'Chiller Sizing', desc: 'Flow rate, temperature change, and chiller tonnage planning.' },
      { to: '/hvac/psychrometrics', label: 'Psychrometrics', desc: 'Dry bulb, wet bulb, dew point, sensible load, and latent load.' },
    ],
  },
]

export default function LearnHubPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="rounded-lg border border-sg-600/40 bg-sg-800/70 p-6 md:p-7">
        <div className="flex items-center gap-2">
          <BookOpen size={22} className="text-accent-500" />
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent-400">Start here</p>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-text">EMaaS.pro Tutorial</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted">
          Use this page as the starting point. Begin with the field workflow that matches the job, enter known site data, review the assumptions, then use the calculators only when you need to verify a specific number.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/scenarios/temp-power"
            className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-sg-900 no-underline hover:bg-accent-400"
          >
            Start a field workflow <ArrowRight size={16} />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-sg-600/50 bg-sg-700 px-4 py-2 text-sm font-semibold text-text no-underline hover:bg-sg-600"
          >
            View dashboard
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList size={16} className="text-accent-500" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-dim">Basic operating path</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {startSteps.map((step, index) => (
            <div key={step.title} className="rounded-lg border border-sg-600/40 bg-sg-800/65 p-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-accent-500/40 bg-accent-500/10 text-xs font-bold text-accent-300">
                {index + 1}
              </div>
              <h3 className="mt-4 text-sm font-bold text-text">{step.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-accent-500" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-dim">Choose the workflow first</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {primaryWorkflows.map((item) => (
            <Link key={item.to} to={item.to} className="no-underline">
              <Card className="h-full border-l-3 border-l-accent-500 transition-colors hover:border-accent-500/50">
                <item.icon size={20} className="mb-3 text-accent-500" />
                <h3 className="text-sm font-bold text-text">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-text-muted">{item.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {referenceGroups.map((group) => (
        <section key={group.group}>
          <div className="mb-3 flex items-center gap-2">
            <group.icon size={16} className="text-accent-500" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-dim">{group.group} references</h2>
          </div>
          <p className="mb-4 max-w-2xl text-xs leading-relaxed text-text-muted">{group.intro}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {group.items.map((item) => (
              <Link key={item.to} to={item.to} className="no-underline">
                <Card className="h-full transition-colors hover:border-accent-500/50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-text">{item.label}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-text-muted">{item.desc}</p>
                    </div>
                    <FileText size={16} className="mt-0.5 shrink-0 text-text-dim" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
