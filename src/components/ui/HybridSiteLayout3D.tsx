import type { HybridProjectPlan, HybridLayoutItem } from '../../features/scenarios/hybridProjectPlan'

const tones: Record<HybridLayoutItem['kind'], { top: string; left: string; right: string }> = {
  generator: { top: '#D88A34', left: '#C27A2C', right: '#34495E' },
  bess: { top: '#ABE1FA', left: '#CCD2E9', right: '#34495E' },
  control: { top: '#E9E4D6', left: '#C5C6C7', right: '#5B6673' },
  switchgear: { top: '#C27A2C', left: '#D88A34', right: '#34495E' },
  transformer: { top: '#CCD2E9', left: '#ABE1FA', right: '#5B6673' },
  fuel: { top: '#C5C6C7', left: '#5B6673', right: '#34495E' },
}

export function HybridSiteLayout3D({ plan }: { plan: HybridProjectPlan }) {
  const scale = Math.min(5.2, 680 / Math.max(1, plan.siteLengthFt + plan.siteWidthFt))
  const originX = 450
  const originY = 65
  const project = (x: number, y: number, z = 0) => ({
    x: originX + ((x - y) * scale),
    y: originY + ((x + y) * scale * 0.48) - (z * scale),
  })
  const points = (...values: { x: number; y: number }[]) => values.map((point) => `${point.x},${point.y}`).join(' ')
  const site = [project(0, 0), project(plan.siteLengthFt, 0), project(plan.siteLengthFt, plan.siteWidthFt), project(0, plan.siteWidthFt)]
  const sorted = [...plan.equipment].sort((a, b) => (a.xFt + a.yFt) - (b.xFt + b.yFt))

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-text">Conceptual 3D equipment envelope</h3>
          <p className="text-xs text-text-dim">Scaled width, length, and estimated height make the space commitment visible; service clearances remain planning allowances.</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${plan.layoutFits ? 'border-signal-blue/40 bg-signal-blue/10 text-signal-blue' : 'border-warning/40 bg-warning/10 text-warning'}`}>
          {plan.layoutFits ? 'Fits entered envelope' : 'Envelope conflict'} · {plan.siteLengthFt} × {plan.siteWidthFt} ft
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-sg-600/45 bg-sg-900/70">
        <svg viewBox="0 0 900 520" role="img" aria-labelledby="hybrid-layout-title hybrid-layout-desc" className="min-h-[360px] w-full">
          <title id="hybrid-layout-title">Three-dimensional hybrid equipment planning layout</title>
          <desc id="hybrid-layout-desc">An isometric equipment envelope showing each generator, battery unit, controls, switchgear, transformer when required, and the fuel service zone inside the entered site dimensions.</desc>
          <polygon points={points(...site)} fill="#141D26" stroke="#5B6673" strokeWidth="2" />
          {sorted.map((item) => {
            const p100 = project(item.xFt + item.lengthFt, item.yFt, 0)
            const p110 = project(item.xFt + item.lengthFt, item.yFt + item.widthFt, 0)
            const p010 = project(item.xFt, item.yFt + item.widthFt, 0)
            const p001 = project(item.xFt, item.yFt, item.heightFt)
            const p101 = project(item.xFt + item.lengthFt, item.yFt, item.heightFt)
            const p111 = project(item.xFt + item.lengthFt, item.yFt + item.widthFt, item.heightFt)
            const p011 = project(item.xFt, item.yFt + item.widthFt, item.heightFt)
            const tone = tones[item.kind]
            return (
              <g key={item.id}>
                <polygon points={points(p100, p110, p111, p101)} fill={tone.right} stroke="#0E151C" strokeWidth="1" />
                <polygon points={points(p010, p110, p111, p011)} fill={tone.left} stroke="#0E151C" strokeWidth="1" />
                <polygon points={points(p001, p101, p111, p011)} fill={tone.top} stroke="#0E151C" strokeWidth="1" />
                <text x={(p001.x + p111.x) / 2} y={Math.min(p001.y, p101.y, p111.y, p011.y) - 5} fill="#F9FAFB" fontSize="10" fontWeight="700" textAnchor="middle">{item.id}</text>
              </g>
            )
          })}
          <text x="22" y="490" fill="#C5C6C7" fontSize="11">Planning visualization only · verify delivered dimensions, clearances, access, fire separation, soil bearing, and cable paths.</text>
        </svg>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {plan.equipment.map((item) => (
          <div key={item.id} className="rounded-md border border-sg-600/35 bg-sg-900/45 px-3 py-2 text-xs">
            <span className="font-bold text-text">{item.id} · {item.label}</span>
            <span className="mt-1 block text-text-dim">{item.lengthFt} × {item.widthFt} × {item.heightFt} ft · {item.detail}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
