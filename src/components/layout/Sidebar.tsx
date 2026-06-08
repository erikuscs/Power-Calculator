import { NavLink } from 'react-router-dom'
import { X, LayoutDashboard, Battery, Plug, Thermometer, Workflow } from 'lucide-react'

const navGroups = [
  {
    label: 'Overview',
    icon: LayoutDashboard,
    items: [{ to: '/', label: 'Dashboard' }],
  },
  {
    label: 'Scenarios',
    icon: Workflow,
    items: [
      { to: '/scenarios/temp-power', label: 'Temp Power & Cooling' },
      { to: '/scenarios/hybrid-energy', label: 'Hybrid Energy (BESS + Gen)' },
    ],
  },
  {
    label: 'BESS',
    icon: Battery,
    items: [
      { to: '/bess/runtime', label: 'Runtime' },
      { to: '/bess/sizing', label: 'Multi-Unit Sizing' },
      { to: '/bess/roi', label: 'Revenue / ROI' },
    ],
  },
  {
    label: 'Electrical Power',
    icon: Plug,
    items: [
      { to: '/power', label: 'Overview' },
      { to: '/power/general', label: 'General Power' },
      { to: '/power/amperes', label: 'Amperes' },
      { to: '/power/kw-kva', label: 'kW ↔ kVA' },
      { to: '/power/kw-hp', label: 'kW ↔ HP' },
      { to: '/power/kw-amp', label: 'kW ↔ Amps' },
      { to: '/power/generator', label: 'Generator Power' },
      { to: '/power/ups', label: 'UPS Power' },
      { to: '/power/fuel', label: 'Fuel Consumption' },
      { to: '/power/lumens', label: 'Lumens & Watts' },
      { to: '/power/kva-amps', label: 'kVA → Amps' },
    ],
  },
  {
    label: 'HVAC',
    icon: Thermometer,
    items: [
      { to: '/hvac', label: 'Overview' },
      { to: '/hvac/cooling', label: 'Cooling Load' },
      { to: '/hvac/chiller', label: 'Chiller Sizing' },
      { to: '/hvac/psychrometrics', label: 'Psychrometrics' },
    ],
  },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-sg-900 border-r border-sg-600 z-50 overflow-y-auto
          transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:z-0
        `}
      >
        <div className="lg:hidden flex justify-end p-3">
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-sg-700 text-text-muted" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="px-3 pb-6 space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-2 px-3 mb-1">
                <group.icon size={14} className="text-accent-500" />
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{group.label}</span>
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `block px-3 py-1.5 rounded-md text-sm transition-colors ${
                          isActive
                            ? 'bg-accent-500/15 text-accent-300 font-medium'
                            : 'text-text-muted hover:bg-sg-700 hover:text-text'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
