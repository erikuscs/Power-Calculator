import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Battery, Plug, Thermometer, Zap, Workflow, Droplets, Lightbulb, Gauge, ArrowLeftRight, Wind, Fuel, BarChart3 } from 'lucide-react'

const scenarios = [
  { to: '/scenarios/temp-power', icon: Zap, title: 'Temp Power & Cooling', desc: 'Emergency sizing — enter your load, get an equipment list', accent: true },
  { to: '/scenarios/hybrid-energy', icon: Workflow, title: 'Hybrid Energy (BESS + Gen)', desc: 'Design BESS + generator systems up to 2 MW with redundancy', accent: true },
  { to: '/scenarios/bess-project', icon: BarChart3, title: 'BESS Project Evaluation', desc: 'System sizing, revenue projections, and ROI analysis', accent: true },
  { to: '/scenarios/hvac-assessment', icon: Thermometer, title: 'HVAC Load Assessment', desc: 'Cooling load, chiller sizing, and airside analysis', accent: true },
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

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-text tracking-tight">Power Calculator</h1>
        <p className="text-text-muted mt-2 text-base leading-relaxed">Sizing tools for BESS, generators, cooling, and hybrid energy systems</p>
      </div>
      <CalcGrid title="Quick Start — What are you sizing today?" items={scenarios} />
      <CalcGrid title="BESS (Battery Energy Storage)" items={bessCalcs} />
      <CalcGrid title="Electrical Power" items={powerCalcs} />
      <CalcGrid title="HVAC / Cooling" items={hvacCalcs} />
    </div>
  )
}
