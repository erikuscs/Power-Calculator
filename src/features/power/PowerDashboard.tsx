import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import {
  Zap, Gauge, ArrowLeftRight, Cog, Repeat,
  ShieldCheck, Battery, Fuel, Lightbulb, ArrowRight,
} from 'lucide-react'

const calculators = [
  {
    to: '/power/general',
    icon: Zap,
    title: 'General Power',
    description: 'Calculate kW and kVA from voltage, current, and power factor.',
  },
  {
    to: '/power/amperes',
    icon: Gauge,
    title: 'Amperes',
    description: 'Find current draw from kW, voltage, and power factor.',
  },
  {
    to: '/power/kw-kva',
    icon: ArrowLeftRight,
    title: 'kW ↔ kVA',
    description: 'Convert between real power (kW) and apparent power (kVA).',
  },
  {
    to: '/power/kw-hp',
    icon: Cog,
    title: 'kW ↔ HP',
    description: 'Convert between kilowatts and horsepower.',
  },
  {
    to: '/power/kw-amp',
    icon: Repeat,
    title: 'kW ↔ Amps',
    description: 'Convert between kilowatts and amperes with phase selection.',
  },
  {
    to: '/power/generator',
    icon: ShieldCheck,
    title: 'Generator Power',
    description: 'Size a generator with 125% safety margin applied.',
  },
  {
    to: '/power/ups',
    icon: Battery,
    title: 'UPS Power',
    description: 'Calculate UPS load and estimate battery runtime.',
  },
  {
    to: '/power/fuel',
    icon: Fuel,
    title: 'Fuel Consumption',
    description: 'Estimate diesel or natural gas consumption with derating factors.',
  },
  {
    to: '/power/lumens',
    icon: Lightbulb,
    title: 'Lumens & Watts',
    description: 'Convert lumens to watts for common lamp types.',
  },
  {
    to: '/power/kva-amps',
    icon: ArrowRight,
    title: 'kVA → Amps',
    description: 'Calculate current from apparent power and voltage.',
  },
]

export default function PowerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Power Calculators</h1>
        <p className="text-sm text-text-muted mt-1">
          Electrical power conversion and sizing tools
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {calculators.map((calc) => (
          <Link key={calc.to} to={calc.to} className="group">
            <Card className="h-full transition-colors group-hover:border-accent-500/50">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent-500/10 text-accent-400">
                  <calc.icon size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-text group-hover:text-accent-300 transition-colors">
                    {calc.title}
                  </h3>
                  <p className="text-sm text-text-muted mt-0.5">{calc.description}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
