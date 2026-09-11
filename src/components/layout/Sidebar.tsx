import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { X, LayoutDashboard, Battery, BookOpen, Plug, Thermometer, Workflow } from 'lucide-react'

const navGroups = [
  {
    label: 'Overview',
    icon: LayoutDashboard,
    items: [
      { to: '/', label: 'EMaaS Dashboard' },
      { to: '/learn', label: 'Start Here' },
    ],
  },
  {
    label: 'Guidance',
    icon: BookOpen,
    items: [{ to: '/learn', label: 'Tutorials & Objectives' }],
  },
  {
    label: 'EMaaS Workflows',
    icon: Workflow,
    items: [
      { to: '/scenarios/temp-power', label: 'Temporary Power' },
      { to: '/hvac/heating', label: 'Temporary Heating Plan' },
      { to: '/estimate', label: 'Build Estimate' },
      { to: '/site-fit', label: 'Site Fit & One-Line' },
      { to: '/scenarios/hybrid-energy', label: 'Hybrid EMaaS Strategy' },
      { to: '/scenarios/bess-project', label: 'BESS Project Evaluation' },
      { to: '/scenarios/hvac-assessment', label: 'HVAC Load Assessment' },
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
  const asideRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus())
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !asideRef.current) return
      const focusable = Array.from(asideRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.offsetParent !== null)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      window.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [open, onClose])

  return (
    <>
      {open && (
        <div aria-hidden="true" className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        ref={asideRef}
        id="emaas-navigation"
        aria-label="EMaaS navigation"
        aria-modal={open ? true : undefined}
        role={open ? 'dialog' : undefined}
        className={`
          fixed top-0 left-0 h-full w-64 bg-sg-900 border-r border-sg-600/30 z-50 overflow-y-auto
          transform transition-transform duration-200
          ${open ? 'visible translate-x-0' : 'invisible -translate-x-full'}
          lg:visible lg:static lg:translate-x-0 lg:z-0
        `}
      >
        <div className="lg:hidden flex justify-end p-3">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-text-muted hover:bg-sg-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="px-3 pb-6 space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-2 px-3 mb-2">
                <group.icon size={13} className="text-accent-500" />
                <span className="text-[10px] font-bold text-text-dim uppercase tracking-[0.15em]">{group.label}</span>
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `block px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-accent-500/10 text-accent-300 font-medium border-l-2 border-accent-500'
                            : 'text-text-muted hover:bg-sg-800 hover:text-text'
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
