import { useState } from 'react'
import {
  BatteryCharging,
  Check,
  Clipboard,
  Copy,
  GitBranch,
  Network,
  Printer,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardHeader } from './Card'
import { Button } from './Button'
import type { OneLineDiagram, OneLineNodeTone } from '../../features/scenarios/oneLineDiagram'

const toneClasses: Record<OneLineNodeTone, string> = {
  source: 'border-accent-500/50 bg-accent-500/10 text-accent-300',
  storage: 'border-signal-blue/50 bg-signal-blue/10 text-signal-blue',
  control: 'border-accent-400/45 bg-sg-900 text-accent-300',
  distribution: 'border-steel-400/35 bg-sg-900 text-steel-400',
  load: 'border-coral-500/45 bg-coral-500/10 text-coral-400',
  service: 'border-sg-500 bg-sg-900 text-text-muted',
}

const toneIcons: Record<OneLineNodeTone, LucideIcon> = {
  source: Zap,
  storage: BatteryCharging,
  control: ShieldCheck,
  distribution: Network,
  load: GitBranch,
  service: Clipboard,
}

interface DiagramPoint {
  x: number
  y: number
}

interface SymbolPlacement extends DiagramPoint {
  node: OneLineDiagram['stages'][number]['nodes'][number]
  stage: string
}

function classifySymbol(node: SymbolPlacement['node']) {
  const id = node.id.toUpperCase()
  const label = node.label.toUpperCase()

  if (id.includes('GEN') || label.includes('GENERATOR')) return 'generator'
  if (id.includes('BESS') || label.includes('BESS')) return 'bess'
  if (id.includes('EMS') || label.includes('CONTROLLER')) return 'controller'
  if (id.includes('ATS') || label.includes('PARALLEL') || label.includes('TRANSFER')) return 'transfer'
  if (id.includes('SWGR') || label.includes('SWITCHGEAR')) return 'switchgear'
  if (id.includes('XFMR') || label.includes('TRANSFORMER')) return 'transformer'
  if (id.includes('PANEL') || label.includes('PANEL')) return 'panel'
  if (id.includes('MOTOR') || label.includes('MOTOR')) return 'motor'
  if (node.tone === 'load') return 'load'
  if (node.tone === 'service') return 'service'
  return 'equipment'
}

function symbolTag(node: SymbolPlacement['node']) {
  const kind = classifySymbol(node)
  if (kind === 'generator') return 'GEN'
  if (kind === 'bess') return 'BESS/PCS'
  if (kind === 'controller') return 'EMS'
  if (kind === 'transfer') return 'ATS/52'
  if (kind === 'switchgear') return 'SWGR'
  if (kind === 'transformer') return 'XFMR'
  if (kind === 'panel') return 'PNL'
  if (kind === 'motor') return 'M'
  if (kind === 'load') return 'LOAD'
  if (kind === 'service') return 'SVC'
  return 'EQ'
}

function clampText(value: string, max = 42) {
  return value.length > max ? `${value.slice(0, max - 1)}...` : value
}

export function OneLineDiagramPanel({ diagram }: { diagram: OneLineDiagram }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'blocked'>('idle')

  const copyMermaid = async () => {
    try {
      await navigator.clipboard.writeText(diagram.mermaid)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 1600)
    } catch {
      setCopyState('blocked')
      window.setTimeout(() => setCopyState('idle'), 2200)
    }
  }

  const printDiagram = () => {
    const cleanup = () => document.body.classList.remove('printing-one-line')
    document.body.classList.add('printing-one-line')
    window.addEventListener('afterprint', cleanup, { once: true })
    window.setTimeout(() => {
      window.print()
      window.setTimeout(cleanup, 1200)
    }, 0)
  }

  return (
    <Card>
      <CardHeader
        title={diagram.title}
        subtitle={diagram.caption}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={printDiagram}>
              <Printer size={14} />
              Print One-Line
            </Button>
            <Button size="sm" variant="secondary" onClick={copyMermaid}>
              {copyState === 'copied' ? <Check size={14} /> : <Copy size={14} />}
              {copyState === 'copied' ? 'Copied' : copyState === 'blocked' ? 'Select Mermaid' : 'Copy Mermaid'}
            </Button>
          </div>
        }
      />

      <PrintableOneLine diagram={diagram} />

      <div className="mb-2 mt-5 text-[11px] text-text-dim lg:hidden">Scroll diagram horizontally to review all stages.</div>
      <div className="overflow-x-auto rounded-lg border border-sg-600/40 bg-sg-900/70 p-4 print-hidden">
        <div
          className="grid min-w-[860px] gap-3"
          style={{ gridTemplateColumns: `repeat(${diagram.stages.length}, minmax(0, 1fr))` }}
        >
          {diagram.stages.map((stage, index) => (
            <div key={stage.label} className="relative">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-text-dim">
                {stage.label}
              </div>
              <div className="space-y-2">
                {stage.nodes.map((node) => {
                  const Icon = toneIcons[node.tone]
                  return (
                    <div key={node.id} className={`rounded-lg border p-3 ${toneClasses[node.tone]}`}>
                      <div className="flex items-center gap-2">
                        <Icon size={15} className="shrink-0" />
                        <h3 className="text-xs font-bold text-text">{node.label}</h3>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-text">{node.detail}</p>
                      {node.meta && <p className="mt-1 text-[11px] leading-relaxed text-text-muted">{node.meta}</p>}
                    </div>
                  )
                })}
              </div>
              {index < diagram.stages.length - 1 && (
                <div className="pointer-events-none absolute right-[-1.05rem] top-1/2 hidden h-px w-5 bg-accent-500/60 xl:block">
                  <span className="absolute -right-1.5 -top-[5px] h-2.5 w-2.5 rotate-45 border-r border-t border-accent-500/60" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[0.8fr_1.2fr] print-hidden">
        <div>
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-text-dim">Assumptions</h3>
          <ul className="space-y-2 text-xs leading-relaxed text-text-muted">
            {diagram.assumptions.map((assumption) => (
              <li key={assumption} className="rounded-lg border border-sg-600/40 bg-sg-900/55 p-3">
                {assumption}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-text-dim">Mermaid Source</h3>
          <textarea
            readOnly
            value={diagram.mermaid}
            className="h-56 w-full resize-none rounded-lg border border-sg-600/50 bg-sg-900 p-3 font-mono text-[11px] leading-relaxed text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500/40"
            aria-label="Mermaid one-line diagram source"
          />
        </div>
      </div>
    </Card>
  )
}

function PrintableOneLine({ diagram }: { diagram: OneLineDiagram }) {
  const columnWidth = 210
  const topPad = 92
  const rowGap = 120
  const leftPad = 90
  const maxNodes = Math.max(...diagram.stages.map((stage) => stage.nodes.length), 1)
  const width = Math.max(1080, leftPad * 2 + (diagram.stages.length - 1) * columnWidth + 120)
  const height = Math.max(520, topPad + maxNodes * rowGap + 130)
  const placements: SymbolPlacement[] = diagram.stages.flatMap((stage, stageIndex) =>
    stage.nodes.map((node, nodeIndex) => ({
      node,
      stage: stage.label,
      x: leftPad + stageIndex * columnWidth,
      y: topPad + nodeIndex * rowGap,
    })),
  )
  const placementById = new Map(placements.map((placement) => [placement.node.id, placement]))

  return (
    <section className="printable-one-line rounded-lg border border-sg-600/40 bg-white p-4 text-sg-900">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-sg-900">Printable Electrical One-Line</h3>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-sg-600">
            Industry-standard style planning schematic. Uses conventional one-line symbols and ANSI/IEEE-style device tags for equipment placement review.
          </p>
        </div>
        <div className="rounded border border-sg-600/30 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sg-700">
          For engineering review
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-sg-600/25 bg-white">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block min-w-[980px] text-sg-900"
          role="img"
          aria-label={`${diagram.title} printable electrical one-line diagram`}
        >
          <defs>
            <marker id="one-line-dot" markerWidth="8" markerHeight="8" refX="4" refY="4">
              <circle cx="4" cy="4" r="2.5" fill="#111827" />
            </marker>
          </defs>

          <rect x="0" y="0" width={width} height={height} fill="#ffffff" />

          <text x="28" y="34" fontSize="18" fontWeight="700" fill="#111827">{diagram.title}</text>
          <text x="28" y="56" fontSize="10" fill="#4b5563">{clampText(diagram.caption, 140)}</text>

          {diagram.stages.map((stage, index) => (
            <g key={stage.label}>
              <text
                x={leftPad + index * columnWidth}
                y="76"
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                letterSpacing="1.2"
                fill="#6b7280"
              >
                {stage.label.toUpperCase()}
              </text>
              <line
                x1={leftPad + index * columnWidth - 70}
                y1="82"
                x2={leftPad + index * columnWidth + 70}
                y2="82"
                stroke="#d1d5db"
                strokeWidth="1"
              />
            </g>
          ))}

          {diagram.edges.map((edge) => {
            const from = placementById.get(edge.from)
            const to = placementById.get(edge.to)
            if (!from || !to) return null

            const isSignal = edge.kind === 'control' || edge.kind === 'service'
            const midX = from.x + (to.x - from.x) / 2
            const labelX = midX
            const labelY = Math.min(from.y, to.y) - 12
            return (
              <g key={`${edge.from}-${edge.to}-${edge.label ?? ''}`}>
                <path
                  d={`M ${from.x + 42} ${from.y} H ${midX} V ${to.y} H ${to.x - 42}`}
                  fill="none"
                  stroke={isSignal ? '#6b7280' : '#111827'}
                  strokeWidth={isSignal ? '1.4' : '2'}
                  strokeDasharray={isSignal ? '6 5' : undefined}
                  markerStart={isSignal ? undefined : 'url(#one-line-dot)'}
                  markerEnd={isSignal ? undefined : 'url(#one-line-dot)'}
                />
                {edge.label && (
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#4b5563"
                  >
                    {clampText(edge.label, 28)}
                  </text>
                )}
              </g>
            )
          })}

          {placements.map((placement) => (
            <g key={placement.node.id}>
              <StandardSymbol placement={placement} />
              <text x={placement.x} y={placement.y + 55} textAnchor="middle" fontSize="10" fontWeight="700" fill="#111827">
                {clampText(placement.node.label, 24)}
              </text>
              <text x={placement.x} y={placement.y + 69} textAnchor="middle" fontSize="8" fill="#4b5563">
                {clampText(placement.node.detail, 34)}
              </text>
              {placement.node.meta && (
                <text x={placement.x} y={placement.y + 81} textAnchor="middle" fontSize="7" fill="#6b7280">
                  {clampText(placement.node.meta, 38)}
                </text>
              )}
            </g>
          ))}

          <Legend x={28} y={height - 86} />
          <text x="28" y={height - 18} fontSize="8" fill="#6b7280">
            Planning one-line only. Final conductor sizing, OCPD ratings, grounding, fault current, protection settings, selective coordination, and labels require licensed engineering review.
          </text>
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 text-xs leading-relaxed text-sg-700 md:grid-cols-2">
        <div className="rounded border border-sg-600/20 bg-sg-900/5 p-3">
          <div className="font-bold uppercase tracking-[0.12em] text-sg-900">Equipment Placement</div>
          <p className="mt-1">
            Source equipment lands left-to-right through disconnects/breakers, ATS or parallel gear, main switchgear bus, transformer, final panels, then protected loads.
          </p>
        </div>
        <div className="rounded border border-sg-600/20 bg-sg-900/5 p-3">
          <div className="font-bold uppercase tracking-[0.12em] text-sg-900">Print Notes</div>
          <p className="mt-1">
            Print in landscape when possible. Keep this diagram with load schedule, cable schedule, grounding plan, and protection/coordination study.
          </p>
        </div>
      </div>
    </section>
  )
}

function StandardSymbol({ placement }: { placement: SymbolPlacement }) {
  const { x, y, node } = placement
  const kind = classifySymbol(node)
  const tag = symbolTag(node)

  if (kind === 'generator') {
    return (
      <g>
        <circle cx={x} cy={y} r="28" fill="#fff" stroke="#111827" strokeWidth="2.5" />
        <text x={x} y={y + 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#111827">G</text>
        <Breaker x={x + 62} y={y} label="52G" />
        <Ground x={x} y={y + 34} />
        <DeviceTag x={x} y={y - 38} label={tag} />
      </g>
    )
  }

  if (kind === 'bess') {
    return (
      <g>
        <rect x={x - 36} y={y - 22} width="44" height="44" fill="#fff" stroke="#111827" strokeWidth="2" />
        <line x1={x - 25} y1={y - 10} x2={x - 25} y2={y + 10} stroke="#111827" strokeWidth="2" />
        <line x1={x - 14} y1={y - 14} x2={x - 14} y2={y + 14} stroke="#111827" strokeWidth="2" />
        <text x={x - 14} y={y + 34} textAnchor="middle" fontSize="8" fill="#111827">BAT</text>
        <rect x={x + 10} y={y - 22} width="44" height="44" fill="#fff" stroke="#111827" strokeWidth="2" />
        <path d={`M ${x + 17} ${y + 2} Q ${x + 26} ${y - 12} ${x + 35} ${y + 2} T ${x + 50} ${y + 2}`} fill="none" stroke="#111827" strokeWidth="1.8" />
        <text x={x + 32} y={y + 34} textAnchor="middle" fontSize="8" fill="#111827">PCS</text>
        <Disconnect x={x + 72} y={y} label="89B" />
        <Ground x={x - 14} y={y + 42} />
        <DeviceTag x={x} y={y - 38} label={tag} />
      </g>
    )
  }

  if (kind === 'controller') {
    return (
      <g>
        <rect x={x - 42} y={y - 26} width="84" height="52" rx="4" fill="#fff" stroke="#111827" strokeWidth="2" strokeDasharray="5 4" />
        <text x={x} y={y - 3} textAnchor="middle" fontSize="14" fontWeight="700" fill="#111827">EMS</text>
        <text x={x} y={y + 13} textAnchor="middle" fontSize="8" fill="#4b5563">SOC / remote start</text>
        <DeviceTag x={x} y={y - 38} label={tag} />
      </g>
    )
  }

  if (kind === 'transfer') {
    return (
      <g>
        <rect x={x - 34} y={y - 28} width="68" height="56" fill="#fff" stroke="#111827" strokeWidth="2" />
        <path d={`M ${x - 20} ${y + 12} L ${x + 18} ${y - 12}`} stroke="#111827" strokeWidth="2.5" />
        <circle cx={x - 22} cy={y + 14} r="3" fill="#111827" />
        <circle cx={x + 20} cy={y - 14} r="3" fill="#111827" />
        <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#111827">ATS</text>
        <DeviceTag x={x} y={y - 40} label={tag} />
      </g>
    )
  }

  if (kind === 'switchgear') {
    return (
      <g>
        <line x1={x} y1={y - 36} x2={x} y2={y + 36} stroke="#111827" strokeWidth="7" />
        <Breaker x={x - 48} y={y - 18} label="52" />
        <Breaker x={x - 48} y={y + 18} label="52" />
        <text x={x + 30} y={y + 4} fontSize="9" fontWeight="700" fill="#111827">BUS</text>
        <Ground x={x} y={y + 42} />
        <DeviceTag x={x} y={y - 46} label={tag} />
      </g>
    )
  }

  if (kind === 'transformer') {
    return (
      <g>
        <circle cx={x - 12} cy={y} r="20" fill="none" stroke="#111827" strokeWidth="2.2" />
        <circle cx={x + 12} cy={y} r="20" fill="none" stroke="#111827" strokeWidth="2.2" />
        <Ground x={x} y={y + 30} />
        <DeviceTag x={x} y={y - 38} label={tag} />
      </g>
    )
  }

  if (kind === 'panel') {
    return (
      <g>
        <rect x={x - 32} y={y - 28} width="64" height="56" fill="#fff" stroke="#111827" strokeWidth="2" />
        <line x1={x - 18} y1={y - 18} x2={x - 18} y2={y + 18} stroke="#111827" strokeWidth="3" />
        <line x1={x - 4} y1={y - 18} x2={x - 4} y2={y + 18} stroke="#111827" strokeWidth="3" />
        <line x1={x + 10} y1={y - 18} x2={x + 10} y2={y + 18} stroke="#111827" strokeWidth="3" />
        <DeviceTag x={x} y={y - 40} label={tag} />
      </g>
    )
  }

  if (kind === 'motor') {
    return (
      <g>
        <circle cx={x} cy={y} r="28" fill="#fff" stroke="#111827" strokeWidth="2.5" />
        <text x={x} y={y + 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#111827">M</text>
        <DeviceTag x={x} y={y - 38} label={tag} />
      </g>
    )
  }

  if (kind === 'load') {
    return (
      <g>
        <rect x={x - 34} y={y - 24} width="68" height="48" rx="3" fill="#fff" stroke="#111827" strokeWidth="2" />
        <path d={`M ${x - 18} ${y - 2} H ${x + 18} M ${x + 8} ${y - 12} L ${x + 18} ${y - 2} L ${x + 8} ${y + 8}`} fill="none" stroke="#111827" strokeWidth="2" />
        <text x={x} y={y + 18} textAnchor="middle" fontSize="8" fill="#111827">LOAD</text>
        <DeviceTag x={x} y={y - 38} label={tag} />
      </g>
    )
  }

  if (kind === 'service') {
    return (
      <g>
        <rect x={x - 40} y={y - 24} width="80" height="48" rx="4" fill="#fff" stroke="#111827" strokeWidth="2" strokeDasharray="4 3" />
        <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#111827">SVC</text>
        <DeviceTag x={x} y={y - 38} label={tag} />
      </g>
    )
  }

  return (
    <g>
      <rect x={x - 32} y={y - 24} width="64" height="48" rx="3" fill="#fff" stroke="#111827" strokeWidth="2" />
      <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#111827">EQ</text>
      <DeviceTag x={x} y={y - 38} label={tag} />
    </g>
  )
}

function Breaker({ x, y, label }: DiagramPoint & { label: string }) {
  return (
    <g>
      <rect x={x - 13} y={y - 13} width="26" height="26" fill="#fff" stroke="#111827" strokeWidth="2" />
      <path d={`M ${x - 8} ${y - 8} L ${x + 8} ${y + 8} M ${x + 8} ${y - 8} L ${x - 8} ${y + 8}`} stroke="#111827" strokeWidth="1.8" />
      <text x={x} y={y + 27} textAnchor="middle" fontSize="8" fontWeight="700" fill="#111827">{label}</text>
    </g>
  )
}

function Disconnect({ x, y, label }: DiagramPoint & { label: string }) {
  return (
    <g>
      <line x1={x - 16} y1={y + 12} x2={x + 12} y2={y - 12} stroke="#111827" strokeWidth="2.2" />
      <circle cx={x - 18} cy={y + 14} r="3" fill="#111827" />
      <circle cx={x + 15} cy={y - 14} r="3" fill="#fff" stroke="#111827" strokeWidth="2" />
      <text x={x} y={y + 31} textAnchor="middle" fontSize="8" fontWeight="700" fill="#111827">{label}</text>
    </g>
  )
}

function Ground({ x, y }: DiagramPoint) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + 7} stroke="#111827" strokeWidth="1.5" />
      <line x1={x - 12} y1={y + 7} x2={x + 12} y2={y + 7} stroke="#111827" strokeWidth="1.5" />
      <line x1={x - 8} y1={y + 12} x2={x + 8} y2={y + 12} stroke="#111827" strokeWidth="1.5" />
      <line x1={x - 4} y1={y + 17} x2={x + 4} y2={y + 17} stroke="#111827" strokeWidth="1.5" />
    </g>
  )
}

function DeviceTag({ x, y, label }: DiagramPoint & { label: string }) {
  return (
    <g>
      <rect x={x - 28} y={y - 10} width="56" height="18" rx="3" fill="#f3f4f6" stroke="#9ca3af" strokeWidth="1" />
      <text x={x} y={y + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="#111827">{label}</text>
    </g>
  )
}

function Legend({ x, y }: DiagramPoint) {
  const items = [
    ['G', 'Generator'],
    ['BESS/PCS', 'Battery + inverter'],
    ['52', 'AC circuit breaker'],
    ['89', 'Disconnect switch'],
    ['XFMR', 'Transformer'],
    ['BUS', 'Switchgear bus'],
    ['GND', 'Grounding point'],
    ['CTRL', 'Dashed control/service'],
  ]

  return (
    <g>
      <text x={x} y={y} fontSize="10" fontWeight="700" fill="#111827">Legend</text>
      {items.map(([tag, label], index) => (
        <g key={tag} transform={`translate(${x + (index % 4) * 250}, ${y + 18 + Math.floor(index / 4) * 24})`}>
          <rect x="0" y="-10" width="42" height="18" rx="3" fill="#f3f4f6" stroke="#9ca3af" strokeWidth="1" />
          <text x="21" y="3" textAnchor="middle" fontSize="7" fontWeight="700" fill="#111827">{tag}</text>
          <text x="48" y="3" fontSize="8" fill="#4b5563">{label}</text>
        </g>
      ))}
    </g>
  )
}
