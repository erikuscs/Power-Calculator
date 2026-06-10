import { useState } from 'react'
import {
  BatteryCharging,
  Check,
  Clipboard,
  Copy,
  GitBranch,
  Network,
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

  return (
    <Card>
      <CardHeader
        title={diagram.title}
        subtitle={diagram.caption}
        action={
          <Button size="sm" variant="secondary" onClick={copyMermaid}>
            {copyState === 'copied' ? <Check size={14} /> : <Copy size={14} />}
            {copyState === 'copied' ? 'Copied' : copyState === 'blocked' ? 'Select Mermaid' : 'Copy Mermaid'}
          </Button>
        }
      />

      <div className="overflow-x-auto rounded-lg border border-sg-600/40 bg-sg-900/70 p-4">
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

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[0.8fr_1.2fr]">
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
