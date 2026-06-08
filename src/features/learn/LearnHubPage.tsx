import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Battery, Plug, Thermometer, BookOpen } from 'lucide-react'

const tutorials = [
  { group: 'BESS', icon: Battery, items: [
    { to: '/bess/runtime', label: 'BESS Runtime', desc: 'Why power factor matters — reactive vs real power, 0.8 vs 1.0' },
    { to: '/bess/sizing', label: 'Multi-Unit Sizing', desc: 'How battery capacity degrades over time and what DoD means in practice' },
    { to: '/bess/roi', label: 'Revenue / ROI', desc: 'Energy arbitrage explained — buying low, selling high, when it\'s profitable' },
  ]},
  { group: 'Electrical Power', icon: Plug, items: [
    { to: '/power/general', label: 'General Power', desc: 'Single-phase vs three-phase — when and why' },
    { to: '/power/kw-kva', label: 'kW vs kVA', desc: 'The power triangle explained — kW, kVA, kVAR' },
    { to: '/power/generator', label: 'Generator Sizing', desc: 'Why you need 125% margin above your load' },
    { to: '/power/fuel', label: 'Fuel Consumption', desc: 'Load-dependent fuel rates — why flat-rate estimates are wrong' },
  ]},
  { group: 'HVAC', icon: Thermometer, items: [
    { to: '/hvac/cooling', label: 'Cooling Load', desc: 'Why occupancy is critical — 450 BTU/hr per person' },
    { to: '/hvac/chiller', label: 'Chiller Sizing', desc: 'Why 2.4 GPM/Ton and when you need a heat exchanger' },
    { to: '/hvac/psychrometrics', label: 'Psychrometrics', desc: 'Dry bulb, wet bulb, dew point — what they actually mean' },
  ]},
]

export default function LearnHubPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-2"><BookOpen size={24} className="text-accent-500" /> Learn Hub</h1>
        <p className="text-text-muted mt-1">How & why behind every calculator — formulas, worked examples, and field tips</p>
      </div>
      {tutorials.map((group) => (
        <div key={group.group}>
          <div className="flex items-center gap-2 mb-3">
            <group.icon size={16} className="text-accent-500" />
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">{group.group}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group.items.map((item) => (
              <Link key={item.to} to={item.to} className="no-underline">
                <Card className="hover:border-accent-500/50 transition-colors">
                  <h3 className="text-sm font-semibold text-text mb-1">{item.label}</h3>
                  <p className="text-xs text-text-muted">{item.desc}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
