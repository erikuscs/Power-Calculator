import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Battery,
  BookOpen,
  CheckCircle2,
  Plug,
  Target,
  Thermometer,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { Card } from '../../components/ui/Card'

interface WorkflowTutorial {
  title: string
  objective: string
  useWhen: string
  example: string
  outcome: string
  to: string
  icon: LucideIcon
  steps: string[]
}

const workflowTutorials: WorkflowTutorial[] = [
  {
    title: 'Temporary Power & Cooling',
    objective: 'Build a defensible generator, cooling, fuel, and service plan from field load information.',
    useWhen: 'Planning construction power, temporary housing, events, emergency response, or commissioning support.',
    example: 'Start with a 200 kW load, 2,000 sq ft facility, 95°F ambient temperature, and 720-hour duration.',
    outcome: 'Equipment sizing, cooling demand, fuel exposure, risk flags, one-line diagram, and a client-ready PDF.',
    to: '/scenarios/temp-power',
    icon: Plug,
    steps: [
      'Choose a single load or build a multi-facility base camp.',
      'Enter measured kW, site conditions, duration, and service assumptions.',
      'Review hidden-load, motor-starting, containment, and staffing risks.',
      'Export the recommended configuration and assumptions for engineering review.',
    ],
  },
  {
    title: 'Hybrid BESS + Generator Strategy',
    objective: 'Compare an all-generator plan with a hybrid system that uses batteries for peaks and generators for base load.',
    useWhen: 'Reducing generator oversizing, fuel use, emissions, noise, or low-load operation on variable-demand sites.',
    example: 'Try an 800 kW peak, 400 kW base load, 300 kW BESS units, and N+1 redundancy.',
    outcome: 'BESS and generator quantities, capacity margin, fuel savings, rental comparison, and system one-line.',
    to: '/scenarios/hybrid-energy',
    icon: Workflow,
    steps: [
      'Separate peak demand from the continuous base load.',
      'Select BESS unit size, redundancy, voltage, and site derating conditions.',
      'Add motors and power zones to expose inrush or distribution constraints.',
      'Compare all-generator and hybrid operating cost before exporting the report.',
    ],
  },
  {
    title: 'BESS Project Evaluation',
    objective: 'Connect battery sizing requirements to a transparent financial case.',
    useWhen: 'Evaluating peak shaving, energy arbitrage, resilience, or an early-stage battery investment.',
    example: 'Model a 500 kW load for four hours using 200 kWh units at 80% depth of discharge.',
    outcome: 'Required energy and units, annual revenue, simple payback, NPV, and year-by-year cash flow.',
    to: '/scenarios/bess-project',
    icon: Battery,
    steps: [
      'Define load, runtime, unit capacity, depth of discharge, and system losses.',
      'Enter project cost, utility rates, cycling, demand charges, and degradation.',
      'Review sizing before interpreting ROI and NPV results.',
      'Export the assumptions with the economics so reviewers can reproduce the result.',
    ],
  },
  {
    title: 'Cooling Load Assessment',
    objective: 'Translate equipment, envelope, occupants, water flow, and air conditions into a cooling strategy.',
    useWhen: 'Sizing temporary cooling, validating chiller requirements, or checking airside and waterside capacity.',
    example: 'Use a 200 kW equipment load, 5,000 sq ft facility, 95°F ambient, and 72°F target.',
    outcome: 'Cooling tonnage, chiller capacity, optional airside cross-check, formulas, and a review-ready report.',
    to: '/scenarios/hvac-assessment',
    icon: Thermometer,
    steps: [
      'Capture equipment heat, space, ambient conditions, occupants, and structure type.',
      'Enter chilled-water temperatures, flow, specific heat, and specific gravity.',
      'Optionally compare airside tonnage using dry-bulb and wet-bulb conditions.',
      'Reconcile the methods and export assumptions for final engineering validation.',
    ],
  },
]

const conceptGroups = [
  {
    group: 'BESS fundamentals',
    icon: Battery,
    items: [
      { to: '/bess/runtime', label: 'Runtime', desc: 'See how kWh, voltage, current, and power factor determine operating time.' },
      { to: '/bess/sizing', label: 'Multi-unit sizing', desc: 'Account for depth of discharge, unit capacity, and losses.' },
      { to: '/bess/roi', label: 'Revenue and ROI', desc: 'Model arbitrage, demand reduction, degradation, payback, and NPV.' },
    ],
  },
  {
    group: 'Electrical fundamentals',
    icon: Plug,
    items: [
      { to: '/power/general', label: 'Single vs three phase', desc: 'Understand how voltage, current, and power factor produce real power.' },
      { to: '/power/kw-kva', label: 'kW vs kVA', desc: 'Separate usable real power from apparent power and reactive load.' },
      { to: '/power/generator', label: 'Generator margin', desc: 'Apply the 125% sizing margin without confusing it with load factor.' },
      { to: '/power/fuel', label: 'Fuel consumption', desc: 'Use load-dependent fuel curves and environmental derating.' },
    ],
  },
  {
    group: 'Cooling fundamentals',
    icon: Thermometer,
    items: [
      { to: '/hvac/cooling', label: 'Cooling load', desc: 'Combine equipment, envelope, occupancy, and humidity heat gains.' },
      { to: '/hvac/chiller', label: 'Chiller sizing', desc: 'Convert water flow and temperature difference into cooling tonnage.' },
      { to: '/hvac/psychrometrics', label: 'Psychrometrics', desc: 'Compare sensible, latent, and total airside cooling.' },
    ],
  },
]

function WorkflowTutorialCard({ tutorial, index }: { tutorial: WorkflowTutorial; index: number }) {
  return (
    <Card className="space-y-5 border-l-3 border-l-accent-500">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-accent-500/10 p-2 text-accent-400">
          <tutorial.icon size={20} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent-400">
            Tutorial {index + 1}
          </p>
          <h2 className="mt-1 text-lg font-bold text-text">{tutorial.title}</h2>
        </div>
      </div>

      <div className="rounded-lg border border-sg-600/40 bg-sg-800/70 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted">
          <Target size={14} className="text-accent-400" />
          Objective
        </div>
        <p className="mt-2 text-sm leading-relaxed text-text">{tutorial.objective}</p>
      </div>

      <div className="grid gap-3 text-sm md:grid-cols-2">
        <div>
          <h3 className="font-semibold text-text">Use this when</h3>
          <p className="mt-1 leading-relaxed text-text-muted">{tutorial.useWhen}</p>
        </div>
        <div>
          <h3 className="font-semibold text-text">Worked starting point</h3>
          <p className="mt-1 leading-relaxed text-text-muted">{tutorial.example}</p>
        </div>
      </div>

      <ol className="space-y-2">
        {tutorial.steps.map((step, stepIndex) => (
          <li key={step} className="flex gap-3 text-sm text-text-muted">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sg-700 text-xs font-bold text-accent-300">
              {stepIndex + 1}
            </span>
            <span className="pt-0.5 leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>

      <div className="flex items-start gap-2 rounded-lg border border-success/25 bg-success/5 p-3 text-sm">
        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />
        <p className="text-text-muted">
          <span className="font-semibold text-text">Expected outcome:</span> {tutorial.outcome}
        </p>
      </div>

      <Link
        to={tutorial.to}
        aria-label={`Start ${tutorial.title} tutorial`}
        className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-bold text-sg-900 no-underline transition-colors hover:bg-accent-400"
      >
        Start tutorial
        <ArrowRight size={15} />
      </Link>
    </Card>
  )
}

export default function LearnHubPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <section className="rounded-lg border border-sg-600/40 bg-sg-800/70 p-6 md:p-8">
        <div className="flex items-center gap-2 text-accent-400">
          <BookOpen size={22} />
          <span className="text-xs font-bold uppercase tracking-[0.15em]">EMaaS guided learning</span>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-text">Plan the system, expose the assumptions, review the risk.</h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-text-muted">
          The objective is not to replace engineering design. EMaaS.pro turns early field
          information into a transparent planning estimate that teams can challenge,
          refine, and hand to a licensed professional engineer.
        </p>
        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg border border-sg-600/40 p-3 text-text-muted"><strong className="text-text">1. Capture</strong><br />Use measured loads and real site conditions.</div>
          <div className="rounded-lg border border-sg-600/40 p-3 text-text-muted"><strong className="text-text">2. Compare</strong><br />Review formulas, margins, alternatives, and risk.</div>
          <div className="rounded-lg border border-sg-600/40 p-3 text-text-muted"><strong className="text-text">3. Communicate</strong><br />Export assumptions and results for validation.</div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-text">Guided workflow tutorials</h2>
          <p className="mt-1 text-sm text-text-muted">Use the provided starting values, follow each step, then replace them with field data.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {workflowTutorials.map((tutorial, index) => (
            <WorkflowTutorialCard key={tutorial.title} tutorial={tutorial} index={index} />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-text">Concept library</h2>
          <p className="mt-1 text-sm text-text-muted">Open a focused calculator to learn the formula through a live example.</p>
        </div>
        {conceptGroups.map((group) => (
          <div key={group.group}>
            <div className="mb-3 flex items-center gap-2">
              <group.icon size={16} className="text-accent-500" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">{group.group}</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {group.items.map((item) => (
                <Link key={item.to} to={item.to} className="no-underline">
                  <Card className="h-full transition-colors hover:border-accent-500/50">
                    <h4 className="text-sm font-semibold text-text">{item.label}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-text-muted">{item.desc}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
