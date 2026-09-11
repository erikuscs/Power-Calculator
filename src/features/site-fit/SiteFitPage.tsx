import { useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  CircuitBoard,
  Container,
  Fan,
  Fuel,
  MapPinned,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { SelectField } from '../../components/ui/SelectField'
import { usePersistedState } from '../../hooks/usePersistedState'
import {
  calculateSiteFit,
  DEFAULT_SITE_FIT_INPUTS,
  type SiteEquipment,
  type SiteFitInputs,
  type SiteFitView,
} from './siteFit'

const equipmentIcons = {
  generator: Zap,
  bess: BatteryCharging,
  switchgear: CircuitBoard,
  transformer: Container,
  fuel: Fuel,
  cooling: Fan,
}

const equipmentTone = {
  generator: 'border-accent-500/70 bg-accent-500/15 text-accent-300',
  bess: 'border-signal-blue/70 bg-signal-blue/15 text-signal-blue',
  switchgear: 'border-coral-500/70 bg-coral-500/15 text-coral-400',
  transformer: 'border-violet-400/70 bg-violet-400/15 text-violet-300',
  fuel: 'border-emerald-400/70 bg-emerald-400/15 text-emerald-300',
  cooling: 'border-cyan-400/70 bg-cyan-400/15 text-cyan-300',
}

function numberFrom(value: string, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function Metric({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'good' | 'warning' }) {
  const toneClass = tone === 'good'
    ? 'border-emerald-400/35 bg-emerald-400/10'
    : tone === 'warning'
      ? 'border-coral-500/35 bg-coral-500/10'
      : 'border-sg-600/45 bg-sg-900/55'
  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-dim">{label}</div>
      <div className="mt-1 text-lg font-bold text-text">{value}</div>
    </div>
  )
}

function SiteEquipmentBlock({
  item,
  selected,
  onSelect,
}: {
  item: SiteEquipment
  selected: boolean
  onSelect: (id: string) => void
}) {
  const Icon = equipmentIcons[item.kind]
  const compactLabel = item.kind === 'transformer'
    ? item.label.replace('Step-Down ', '').replace('Step-Up ', '')
    : item.label
  const left = Math.min(82, Math.max(3, item.x))
  const top = Math.min(78, Math.max(4, item.y))
  const width = Math.min(40, Math.max(15, item.lengthFt / 1.9))
  const height = Math.min(23, Math.max(12, item.widthFt * 1.05))

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${item.label}, ${item.rating}`}
      onClick={() => onSelect(item.id)}
      className={`absolute z-10 rounded-md border p-2 text-left shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 ${equipmentTone[item.kind]} ${selected ? 'ring-2 ring-white/80' : ''}`}
      style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, minHeight: `${height}%` }}
    >
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide">
        <Icon size={13} aria-hidden="true" /> {item.id}
      </span>
      <span className="mt-1 block text-xs font-bold text-text">{compactLabel}</span>
      <span className="mt-0.5 block text-[10px] leading-tight text-text-muted">{item.lengthFt} × {item.widthFt} ft</span>
    </button>
  )
}

function SitePlan({
  inputs,
  equipment,
  selectedId,
  onSelect,
}: {
  inputs: SiteFitInputs
  equipment: SiteEquipment[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  const exclusionWidth = Math.min(35, Math.max(9, (inputs.exclusionLengthFt / Math.max(1, inputs.siteLengthFt)) * 100))
  const exclusionHeight = Math.min(40, Math.max(10, (inputs.exclusionWidthFt / Math.max(1, inputs.siteWidthFt)) * 100))
  const laneWidth = Math.min(34, Math.max(10, (inputs.accessLaneWidthFt / Math.max(1, inputs.siteLengthFt)) * 100))

  return (
    <div id="site-plan" className="scroll-mt-24">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-text">Dimensioned site board</h3>
          <p className="text-xs text-text-dim">Conceptual planning blocks include service-clearance allowances.</p>
        </div>
        <span className="rounded-full border border-sg-600/50 bg-sg-900/60 px-3 py-1 text-xs font-semibold text-text-muted">
          {inputs.siteLengthFt} × {inputs.siteWidthFt} ft boundary
        </span>
      </div>
      <div className="relative aspect-[16/10] min-h-[360px] overflow-hidden rounded-lg border-2 border-sg-500/60 bg-sg-900 shadow-inner">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(#697586 1px, transparent 1px), linear-gradient(90deg, #697586 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute left-3 top-3 z-20 rounded bg-sg-950/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">Customer site boundary</div>
        <div
          className="absolute bottom-0 right-0 z-[1] border-l border-t border-dashed border-coral-400/70 bg-coral-500/10 p-2 text-right text-[10px] font-bold uppercase tracking-wide text-coral-400"
          style={{ width: `${exclusionWidth}%`, height: `${exclusionHeight}%` }}
        >
          Exclusion<br />{inputs.exclusionLengthFt} × {inputs.exclusionWidthFt} ft
        </div>
        <div
          className="absolute bottom-0 left-0 top-0 z-[1] border-r border-dashed border-signal-blue/60 bg-signal-blue/5"
          style={{ width: `${laneWidth}%` }}
        >
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 -rotate-90 whitespace-nowrap text-[10px] font-bold uppercase tracking-wide text-signal-blue">
            {inputs.accessLaneWidthFt} ft access lane
          </span>
        </div>
        <div className="absolute left-2/3 top-[42%] z-[2] h-px w-1/4 border-t border-dashed border-accent-400/80" />
        {equipment.map((item) => (
          <SiteEquipmentBlock key={item.id} item={item} selected={item.id === selectedId} onSelect={onSelect} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-text-dim">
        <span>Solid blocks = equipment</span>
        <span>Grid = planning scale</span>
        <span>Blue = access</span>
        <span>Coral = unavailable area</span>
      </div>
    </div>
  )
}

function OneLine({ equipment, selectedId, onSelect }: { equipment: SiteEquipment[]; selectedId: string; onSelect: (id: string) => void }) {
  const orderedKinds = ['generator', 'switchgear', 'transformer', 'bess', 'cooling']
  const nodes = [...equipment]
    .filter((item) => item.kind !== 'fuel')
    .sort((a, b) => orderedKinds.indexOf(a.kind) - orderedKinds.indexOf(b.kind))

  return (
    <div id="electrical-one-line" className="scroll-mt-24">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-text">Linked one-line</h3>
        <p className="text-xs text-text-dim">Select a node to identify the matching site block and why it is included.</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-sg-600/45 bg-sg-900/65 p-4">
        <div className="flex min-w-[660px] items-center justify-center">
          {nodes.map((item, index) => {
            const Icon = equipmentIcons[item.kind]
            return (
              <div key={item.id} className="flex items-center">
                {index > 0 && <div aria-hidden="true" className="h-px w-10 bg-accent-500/70 sm:w-14" />}
                <button
                  type="button"
                  aria-pressed={selectedId === item.id}
                  onClick={() => onSelect(item.id)}
                  className={`w-28 rounded-lg border px-3 py-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 ${equipmentTone[item.kind]} ${selectedId === item.id ? 'ring-2 ring-white/80' : ''}`}
                >
                  <Icon className="mx-auto" size={18} aria-hidden="true" />
                  <span className="mt-1 block text-[10px] font-bold">{item.id}</span>
                  <span className="mt-0.5 block text-[10px] leading-tight text-text-muted">{item.label}</span>
                </button>
              </div>
            )
          })}
          <div aria-hidden="true" className="h-px w-10 bg-accent-500/70 sm:w-14" />
          <div className="w-24 rounded-lg border border-sg-500/60 bg-sg-800 px-3 py-3 text-center text-[10px] font-bold text-text-muted">LOADS</div>
        </div>
      </div>
    </div>
  )
}

export default function SiteFitPage() {
  const [inputs, setInputs] = usePersistedState<SiteFitInputs>('site-fit', 'inputs', DEFAULT_SITE_FIT_INPUTS)
  const [view, setView] = usePersistedState<SiteFitView>('site-fit', 'view', 'integrated')
  const [selectedId, setSelectedId] = useState('GEN-1')
  const [validationMessage, setValidationMessage] = useState('')
  const requestedPowerRef = useRef<HTMLDivElement>(null)
  const result = useMemo(() => calculateSiteFit(inputs), [inputs])
  const selected = result.equipment.find((item) => item.id === selectedId) ?? result.equipment[0]

  const update = <K extends keyof SiteFitInputs>(field: K, value: SiteFitInputs[K]) => {
    setInputs((current) => ({ ...current, [field]: value }))
    setValidationMessage('')
  }

  const cableTotal = result.totalCablePieces === null
    ? `${result.totalCablePieceRange?.[0]}–${result.totalCablePieceRange?.[1]} pieces`
    : `${result.totalCablePieces} pieces`

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent-400">EMaaS field planning</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-text">Site Fit & One-Line</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted">
            Translate a temporary power package into a customer-ready electrical story and a dimensioned space commitment.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              requestedPowerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              window.setTimeout(() => requestedPowerRef.current?.querySelector('input')?.focus(), 300)
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-accent-500/45 bg-accent-500/10 px-4 py-2.5 text-sm font-bold text-accent-300 hover:bg-accent-500/20"
          >
            <MapPinned size={16} /> Edit site limits
          </button>
          <button
            type="button"
            onClick={() => setValidationMessage(result.fits ? 'Package fits the entered planning boundary.' : 'Package exceeds the entered planning boundary.')}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-bold text-sg-950 hover:bg-accent-400"
          >
            <ShieldCheck size={16} /> Validate package
          </button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)_330px]">
        <Card className="h-fit" >
          <CardHeader title="Job constraints" subtitle="Use known conditions; unresolved items remain visible for field review." />
          <div ref={requestedPowerRef} className="space-y-4">
            <InputField label="Requested power" unit="kW" value={inputs.requestedPowerKw} min={0} onChange={(value) => update('requestedPowerKw', numberFrom(value))} />
            <SelectField label="Package" value={inputs.scenario} onChange={(value) => update('scenario', value as SiteFitInputs['scenario'])} options={[
              { value: 'power', label: 'Temporary power' },
              { value: 'power_cooling', label: 'Power + cooling' },
              { value: 'hybrid', label: 'Hybrid generator + BESS' },
            ]} />
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Source voltage" unit="V" value={String(inputs.sourceVoltage)} onChange={(value) => update('sourceVoltage', numberFrom(value, 480))} options={[208, 240, 480, 600, 4160].map((value) => ({ value: String(value), label: String(value) }))} />
              <SelectField label="Load voltage" unit="V" value={String(inputs.loadVoltage)} onChange={(value) => update('loadVoltage', numberFrom(value, 208))} options={[120, 208, 240, 480, 600, 4160].map((value) => ({ value: String(value), label: String(value) }))} />
            </div>
            <InputField label="Power factor" value={inputs.powerFactor} min={0.1} max={1} step="0.01" onChange={(value) => update('powerFactor', numberFrom(value, 0.8))} />
            <div className="border-t border-sg-600/35 pt-4">
              <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-text-dim">Usable site boundary</div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Length" unit="ft" value={inputs.siteLengthFt} min={0} onChange={(value) => update('siteLengthFt', numberFrom(value))} />
                <InputField label="Width" unit="ft" value={inputs.siteWidthFt} min={0} onChange={(value) => update('siteWidthFt', numberFrom(value))} />
                <InputField label="Exclusion length" unit="ft" value={inputs.exclusionLengthFt} min={0} onChange={(value) => update('exclusionLengthFt', numberFrom(value))} />
                <InputField label="Exclusion width" unit="ft" value={inputs.exclusionWidthFt} min={0} onChange={(value) => update('exclusionWidthFt', numberFrom(value))} />
              </div>
            </div>
            <InputField label="Access lane width" unit="ft" value={inputs.accessLaneWidthFt} min={0} onChange={(value) => update('accessLaneWidthFt', numberFrom(value))} />
            <InputField label="Longest cable route" unit="ft" value={inputs.longestRouteFt} min={0} onChange={(value) => update('longestRouteFt', numberFrom(value))} />
            <SelectField label="Neutral plan" value={inputs.neutralPlan} onChange={(value) => update('neutralPlan', value as SiteFitInputs['neutralPlan'])} options={[
              { value: 'required', label: 'Carry neutral' },
              { value: 'not_carried', label: 'No neutral — line-to-line only' },
              { value: 'review', label: 'Unresolved — show range' },
            ]} />
            <SelectField label="Continuity" value={inputs.continuity} onChange={(value) => update('continuity', value as SiteFitInputs['continuity'])} options={[
              { value: 'standard', label: 'Standard source' },
              { value: 'n_plus_1', label: 'N+1 generator continuity' },
            ]} />
            <button type="button" onClick={() => setInputs(DEFAULT_SITE_FIT_INPUTS)} className="inline-flex items-center gap-2 text-xs font-semibold text-text-dim hover:text-text">
              <RefreshCw size={13} /> Reset planning example
            </button>
          </div>
        </Card>

        <section className="min-w-0 space-y-4">
          <div className="flex flex-wrap gap-2" aria-label="Visualization view">
            {([
              ['integrated', 'Integrated view'],
              ['site', 'Site layout'],
              ['one_line', 'One-line only'],
            ] as const).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)} className={`rounded-lg border px-4 py-2 text-xs font-bold transition-colors ${view === value ? 'border-accent-500 bg-accent-500/15 text-accent-300' : 'border-sg-600/45 bg-sg-800 text-text-muted hover:text-text'}`}>
                {label}
              </button>
            ))}
          </div>

          <Card className="space-y-6">
            {view !== 'one_line' && <SitePlan inputs={inputs} equipment={result.equipment} selectedId={selected?.id ?? ''} onSelect={setSelectedId} />}
            {view === 'integrated' && <div className="border-t border-sg-600/35" />}
            {view !== 'site' && <OneLine equipment={result.equipment} selectedId={selected?.id ?? ''} onSelect={setSelectedId} />}
          </Card>

          <div className={`rounded-lg border p-4 ${result.fits ? 'border-emerald-400/35 bg-emerald-400/10' : 'border-coral-500/40 bg-coral-500/10'}`} role="status" aria-live="polite">
            <div className="flex items-start gap-3">
              {result.fits ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={20} /> : <AlertTriangle className="mt-0.5 shrink-0 text-coral-400" size={20} />}
              <div>
                <h2 className="text-sm font-bold text-text">{!result.validDemand ? 'Enter a requested power load' : result.fits ? 'Package fits the entered planning area' : 'Site constraint limits the requested package'}</h2>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">
                  {!result.validDemand
                    ? 'A load greater than 0 kW is required before source equipment, cable quantities, or a site-fit conclusion can be shown.'
                    : result.fits
                    ? `${Math.round(result.remainingAreaSqFt).toLocaleString()} sq ft remains after conceptual equipment envelopes, the exclusion zone, and the access lane.`
                    : result.shortfallSqFt > 0
                      ? `The entered site can conservatively support about ${result.planningPowerCeilingKw.toLocaleString()} kW under the current package assumptions; ${inputs.requestedPowerKw.toLocaleString()} kW was requested. Add ${Math.round(result.shortfallSqFt).toLocaleString()} sq ft or revise the package.`
                      : `The total area is sufficient on paper, but the entered length and width cannot place the required equipment, access, exclusion, and service-clearance blocks. The conservative planning power limit is ${result.planningPowerCeilingKw.toLocaleString()} kW until the site shape or package changes.`}
                </p>
                {validationMessage && <p className="mt-2 text-xs font-bold text-text">{validationMessage}</p>}
              </div>
            </div>
          </div>
        </section>

        <aside id="quote-explanation" className="scroll-mt-24 space-y-4">
          <Card>
            <CardHeader title="Space-to-power check" subtitle="A commercial planning constraint, not a stamped site plan." />
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Required footprint" value={`${Math.round(result.requiredAreaSqFt).toLocaleString()} sq ft`} />
              <Metric label="Available area" value={`${Math.round(result.availableAreaSqFt).toLocaleString()} sq ft`} />
              <Metric
                label={!result.validDemand ? 'Fit status' : result.fits ? 'Remaining' : result.shortfallSqFt > 0 ? 'Shortfall' : 'Shape conflict'}
                value={!result.validDemand ? 'Awaiting load' : result.fits ? `${Math.round(result.remainingAreaSqFt).toLocaleString()} sq ft` : result.shortfallSqFt > 0 ? `${Math.round(result.shortfallSqFt).toLocaleString()} sq ft` : 'Layout blocked'}
                tone={result.fits ? 'good' : 'warning'}
              />
              <Metric label="Planning ceiling" value={result.validDemand ? `${result.planningPowerCeilingKw.toLocaleString()} kW` : 'Withheld'} tone={result.validDemand && result.planningPowerCeilingKw >= inputs.requestedPowerKw ? 'good' : 'warning'} />
            </div>
          </Card>

          {selected && (
            <Card>
              <div className="flex items-center gap-3">
                <Sparkles size={18} className="text-accent-400" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-dim">Selected equipment</div>
                  <h2 className="text-sm font-bold text-text">{selected.id} · {selected.label}</h2>
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold text-accent-300">{selected.rating}</p>
              <p className="mt-2 text-xs leading-relaxed text-text-muted">{selected.reason}</p>
            </Card>
          )}

          {result.validDemand ? (
            <Card>
              <CardHeader title="Quote explanation" subtitle="Plain-language reasons the package appears in the estimate." />
              <div className="space-y-4 text-xs leading-relaxed text-text-muted">
                <div>
                  <div className="font-bold text-text">Transformer</div>
                  <p className="mt-1">{result.transformerReason}</p>
                </div>
                <div>
                  <div className="font-bold text-text">Neutral</div>
                  <p className="mt-1">{result.neutralExplanation}</p>
                </div>
                <div>
                  <div className="font-bold text-text">Cable schedule</div>
                  <p className="mt-1">{Math.round(result.ampsPerPhase).toLocaleString()} A/phase requires {result.cableRunsPerPhase} planning run{result.cableRunsPerPhase === 1 ? '' : 's'}/phase. For {result.routeSections} × 50 ft route section{result.routeSections === 1 ? '' : 's'}, plan {cableTotal}.</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader title="Quote explanation" subtitle="Enter a positive requested load to generate the transformer, neutral, and cable rationale." />
            </Card>
          )}

          {result.largeLowVoltageReview && (
            <div className="rounded-lg border border-warning/45 bg-warning/10 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-warning"><AlertTriangle size={17} /> Large low-voltage system</div>
              <p className="mt-2 text-xs leading-relaxed text-text-muted">High current, parallel conductors, fault duty, switching, bus, grounding, and selective coordination can materially change this layout. Require engineering and vendor review before quoting final quantities.</p>
            </div>
          )}

          <div className="rounded-lg border border-sg-600/40 bg-sg-800/55 p-4 text-xs leading-relaxed text-text-dim">
            <div className="mb-2 flex items-center gap-2 font-bold text-text"><Route size={15} /> Field verification boundary</div>
            Confirm actual manufacturer dimensions, service clearances, fire/setback rules, grounding, fault current, protective-device coordination, soil bearing, cable path, and authority requirements.
          </div>
        </aside>
      </div>
    </div>
  )
}
