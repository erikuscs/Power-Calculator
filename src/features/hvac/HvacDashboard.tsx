import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Thermometer, Droplets, Wind } from 'lucide-react'

const calculators = [
  { to: '/hvac/cooling', icon: Thermometer, title: 'Cooling Load', desc: 'Building/tent cooling calculation with structure type and occupancy' },
  { to: '/hvac/chiller', icon: Droplets, title: 'Chiller Sizing', desc: 'GPM, ΔT, and tonnage calculation — 2.4 GPM/Ton standard' },
  { to: '/hvac/psychrometrics', icon: Wind, title: 'Psychrometrics', desc: 'Airside tonnage — sensible, latent, and total cooling from CFM' },
]

export default function HvacDashboard() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">HVAC Calculators</h1>
        <p className="text-text-muted mt-1">Cooling load, chiller sizing, and psychrometric calculations</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {calculators.map((calc) => (
          <Link key={calc.to} to={calc.to} className="no-underline">
            <Card className="hover:border-accent-500/50 transition-colors h-full">
              <calc.icon size={24} className="text-accent-500 mb-3" />
              <h3 className="text-base font-semibold text-text mb-1">{calc.title}</h3>
              <p className="text-sm text-text-muted">{calc.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
