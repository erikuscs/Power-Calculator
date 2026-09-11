import { useEffect } from 'react'
import { ClipboardCheck, Plus, Trash2 } from 'lucide-react'
import { Card, CardHeader } from '../../components/ui/Card'
import { InputField } from '../../components/ui/InputField'
import { SelectField } from '../../components/ui/SelectField'
import { Button } from '../../components/ui/Button'
import { PdfExportButton } from '../../components/pdf/PdfExportButton'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import {
  ESTIMATE_DRAFT_KEY,
  calculateEstimateTotals,
  deriveEstimateStatus,
  emptyEstimateDraft,
  estimateStatusLabel,
  type EstimateDraft,
  type EstimateLineCategory,
} from './estimateDraft'

const categoryOptions = [
  ['equipment', 'Equipment'], ['accessory', 'Accessory / distribution'], ['fuel', 'Fuel'],
  ['delivery', 'Delivery / pickup'], ['labor', 'Installation / labor'], ['service', 'Service coverage'], ['other', 'Other'],
].map(([value, label]) => ({ value, label }))

function numeric(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

export default function EstimatePage() {
  const [draft, setDraft] = useLocalStorage<EstimateDraft>(ESTIMATE_DRAFT_KEY, emptyEstimateDraft)
  const totals = calculateEstimateTotals(draft)
  const money = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

  useEffect(() => {
    const status = deriveEstimateStatus(draft)
    if (status !== draft.status) setDraft((current) => ({ ...current, status }))
  }, [draft, setDraft])

  const setField = <K extends keyof EstimateDraft>(field: K, value: EstimateDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const addLine = () => setDraft((current) => ({
    ...current,
    availabilityAndRatesConfirmed: false,
    lineItems: [...current.lineItems, {
      id: `line-${Date.now()}`,
      category: 'equipment',
      description: '',
      modelSku: '',
      quantity: 1,
      rate: 0,
      periods: 1,
      rateUnit: 'day',
    }],
  }))

  const updateLine = (id: string, field: string, value: string | number) => setDraft((current) => ({
    ...current,
    availabilityAndRatesConfirmed: false,
    lineItems: current.lineItems.map((line) => line.id === id ? { ...line, [field]: value } : line),
  }))

  const removeLine = (id: string) => setDraft((current) => ({
    ...current,
    availabilityAndRatesConfirmed: false,
    lineItems: current.lineItems.filter((line) => line.id !== id),
  }))

  const identityComplete = Boolean(
    draft.clientName.trim() && draft.contactName.trim() && draft.projectName.trim()
    && draft.jobsiteAddress.trim() && draft.estimatorName.trim() && draft.quoteNumber.trim()
    && draft.billingAndPoRequirements.trim() && draft.neededBy && draft.validUntil,
  )
  const packageComplete = draft.lineItems.length > 0 && draft.lineItems.every((line) => (
    line.description.trim() && line.modelSku.trim() && line.quantity > 0 && line.periods > 0
  ))
  const logisticsComplete = Boolean(
    draft.cableOrDuctDistance.trim() && draft.connectionAndDistribution.trim()
    && draft.deliveryAccess.trim() && draft.deliveryPickupPlan.trim()
    && draft.placementAndClearance.trim() && draft.fuelAndServicePlan.trim()
    && draft.siteRestrictions.trim() && draft.commercialTerms.trim(),
  )
  const canApprove = identityComplete && packageComplete && logisticsComplete && draft.planningRequirements.length > 0
  const scopeCanBeConfirmed = identityComplete && draft.planningRequirements.length > 0

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card>
        <CardHeader
          title="Build Estimate"
          subtitle="Carry planning requirements into an equipment, logistics, and commercial estimate without changing calculator results"
          action={<Button type="button" variant="ghost" size="sm" onClick={() => {
            if (window.confirm('Start a new estimate? This clears the current local estimate draft.')) setDraft({ ...emptyEstimateDraft })
          }}>Start New Estimate</Button>}
        />
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent-500/35 bg-accent-500/10 p-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-accent-300">{estimateStatusLabel[draft.status]}</div>
            <p className="mt-1 text-xs text-text-muted">A calculation import is evidence of the planning requirement, not approval of the selected equipment.</p>
          </div>
          <ClipboardCheck size={24} className="text-accent-400" />
        </div>
        <p className="mb-4 rounded-lg border border-sg-600/40 bg-sg-900/50 p-3 text-xs leading-relaxed text-text-muted">
          This draft is saved only in this browser or device. Do not enter sensitive customer information on a shared device; clearing app data removes the draft.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InputField label="Client / Account" type="text" value={draft.clientName} onChange={(value) => setField('clientName', value)} required />
          <InputField label="Contact Name" type="text" value={draft.contactName} onChange={(value) => setField('contactName', value)} />
          <InputField label="Project / Phase" type="text" value={draft.projectName} onChange={(value) => setField('projectName', value)} required />
          <InputField label="Jobsite Address" type="text" value={draft.jobsiteAddress} onChange={(value) => setField('jobsiteAddress', value)} required />
          <InputField label="Estimator" type="text" value={draft.estimatorName} onChange={(value) => setField('estimatorName', value)} />
          <InputField label="Quote / Opportunity Number" type="text" value={draft.quoteNumber} onChange={(value) => setField('quoteNumber', value)} />
          <InputField label="Billing / PO Requirements" type="text" value={draft.billingAndPoRequirements} onChange={(value) => setField('billingAndPoRequirements', value)} placeholder="PO, billing address, deposit, or N/A" />
          <InputField label="Requested On" type="date" value={draft.requestedOn} onChange={(value) => setField('requestedOn', value)} />
          <InputField label="Needed By" type="date" value={draft.neededBy} onChange={(value) => setField('neededBy', value)} />
          <InputField label="Valid Until" type="date" value={draft.validUntil} onChange={(value) => setField('validUntil', value)} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Calculated Requirements" subtitle="Import from Temporary Power, Cooling Load, or Temporary Heating" />
        {draft.planningRequirements.length === 0 ? (
          <p className="rounded-lg border border-warning/35 bg-warning/10 p-4 text-sm text-warning">No calculator results imported. Complete a planning workflow and choose Add to Estimate.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-3">
            {draft.planningRequirements.map((requirement) => (
              <div key={requirement.id} className="rounded-lg border border-sg-600/45 bg-sg-900/55 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><div className="text-sm font-bold text-text">{requirement.title}</div><p className="mt-1 text-xs text-text-muted">{requirement.summary}</p></div>
                  <button type="button" aria-label={`Remove ${requirement.title}`} onClick={() => setField('planningRequirements', draft.planningRequirements.filter((item) => item.id !== requirement.id))} className="text-text-dim hover:text-coral-400"><Trash2 size={16} /></button>
                </div>
                <dl className="mt-3 space-y-1 text-xs">{requirement.details.map((detail) => <div key={detail.label} className="flex justify-between gap-3"><dt className="text-text-dim">{detail.label}</dt><dd className="text-right font-semibold text-text">{detail.value}</dd></div>)}</dl>
                {requirement.assumptions.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-warning">{requirement.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Equipment and Commercial Lines" subtitle="Use actual rentable models, current rates, and every accessory or service required for the job" action={<Button type="button" size="sm" onClick={addLine}><Plus size={15} /> Add line</Button>} />
        <div className="space-y-4">
          {draft.lineItems.length === 0 && <p className="text-sm text-text-muted">No equipment or commercial lines added.</p>}
          {draft.lineItems.map((line, index) => (
            <div key={line.id} className="rounded-lg border border-sg-600/45 bg-sg-900/45 p-4">
              <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-text-dim">Line {index + 1}</span><button type="button" aria-label={`Remove line ${index + 1}`} onClick={() => removeLine(line.id)} className="text-text-dim hover:text-coral-400"><Trash2 size={16} /></button></div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SelectField label="Category" value={line.category} onChange={(value) => updateLine(line.id, 'category', value as EstimateLineCategory)} options={categoryOptions} />
                <InputField label="Description" type="text" value={line.description} onChange={(value) => updateLine(line.id, 'description', value)} required />
                <InputField label="Model / SKU" type="text" value={line.modelSku} onChange={(value) => updateLine(line.id, 'modelSku', value)} required />
                <InputField label="Quantity" value={line.quantity} onChange={(value) => updateLine(line.id, 'quantity', numeric(value))} min={0} required />
                <InputField label="Rate" unit="$" value={line.rate} onChange={(value) => updateLine(line.id, 'rate', numeric(value))} min={0} />
                <InputField label="Periods" value={line.periods} onChange={(value) => updateLine(line.id, 'periods', numeric(value))} min={0} required />
                <SelectField label="Rate Unit" value={line.rateUnit} onChange={(value) => updateLine(line.id, 'rateUnit', value)} options={['each', 'day', 'week', '28-day cycle', 'hour', 'gallon'].map((value) => ({ value, label: value }))} />
                <div className="rounded-lg border border-sg-600/40 p-3"><div className="text-xs uppercase tracking-wider text-text-dim">Extended</div><div className="mt-2 text-lg font-bold text-text">{money(line.quantity * line.periods * line.rate)}</div></div>
              </div>
            </div>
          ))}
          <div className="grid grid-cols-1 gap-4 border-t border-sg-600/40 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <InputField label="Discount" unit="%" value={draft.discountPercent} onChange={(value) => setField('discountPercent', numeric(value))} min={0} max={100} />
            <InputField label="Tax" unit="%" value={draft.taxPercent} onChange={(value) => setField('taxPercent', numeric(value))} min={0} />
            <div className="rounded-lg border border-sg-600/40 p-3 text-sm text-text-muted">Subtotal<div className="mt-1 text-lg font-bold text-text">{money(totals.subtotal)}</div></div>
            <div className="rounded-lg border border-sg-600/40 p-3 text-sm text-text-muted">Discount Amount<div className="mt-1 text-lg font-bold text-text">-{money(totals.discount)}</div></div>
            <div className="rounded-lg border border-sg-600/40 p-3 text-sm text-text-muted">Tax Amount<div className="mt-1 text-lg font-bold text-text">{money(totals.tax)}</div></div>
            <div className="rounded-lg border border-accent-500/40 bg-accent-500/10 p-3 text-sm text-accent-300">Estimated Total<div className="mt-1 text-xl font-bold text-text">{money(totals.total)}</div></div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Site, Logistics, and Service" subtitle="Capture the information that turns a sizing result into a deliverable field package" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField label="Cable / Duct / Hose Distance" type="text" value={draft.cableOrDuctDistance} onChange={(value) => setField('cableOrDuctDistance', value)} placeholder="Lengths, routing, and connection points" />
          <InputField label="Connections and Distribution" type="text" value={draft.connectionAndDistribution} onChange={(value) => setField('connectionAndDistribution', value)} placeholder="Voltage, phase, connectors, panels, ATS" />
          <InputField label="Delivery Access" type="text" value={draft.deliveryAccess} onChange={(value) => setField('deliveryAccess', value)} placeholder="Gate, road, forklift, crane, delivery window" />
          <InputField label="Delivery / Pickup Plan" type="text" value={draft.deliveryPickupPlan} onChange={(value) => setField('deliveryPickupPlan', value)} placeholder="Delivery and removal dates, contacts, and responsibilities" />
          <InputField label="Placement and Clearances" type="text" value={draft.placementAndClearance} onChange={(value) => setField('placementAndClearance', value)} placeholder="Footprint, exhaust, ventilation, setbacks" />
          <InputField label="Fuel and Service Plan" type="text" value={draft.fuelAndServicePlan} onChange={(value) => setField('fuelAndServicePlan', value)} placeholder="Tank, refill threshold, PM and response cadence" />
          <InputField label="Restrictions / Permits" type="text" value={draft.siteRestrictions} onChange={(value) => setField('siteRestrictions', value)} placeholder="Noise, emissions, hours, permits, containment" />
          <InputField label="Commercial Terms" type="text" value={draft.commercialTerms} onChange={(value) => setField('commercialTerms', value)} placeholder="Payment, cancellation, damage waiver, exclusions, or N/A" />
          <div className="sm:col-span-2"><InputField label="Estimate Notes" type="text" value={draft.notes} onChange={(value) => setField('notes', value)} placeholder="Exclusions, assumptions, alternates, billing notes" /></div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Release Gate" subtitle="A quote is approved only when the customer scope, technical review, and current commercial availability are confirmed" />
        {!canApprove && <p role="alert" className="mb-4 rounded-lg border border-warning/35 bg-warning/10 p-3 text-xs text-warning">Before approval, complete the customer, quote, schedule, billing, equipment model/SKU, logistics, service, and commercial-term fields and import at least one calculation. Enter N/A only when a reviewer confirms a field does not apply.</p>}
        <div className="space-y-3">
          {([
            { field: 'scopeConfirmed', label: 'Customer scope and operating schedule confirmed', enabled: scopeCanBeConfirmed },
            { field: 'technicalReviewComplete', label: 'Technical reviewer approved equipment suitability and field configuration', enabled: canApprove && draft.scopeConfirmed },
            { field: 'availabilityAndRatesConfirmed', label: 'Equipment availability and current rates confirmed', enabled: canApprove && draft.technicalReviewComplete },
          ] satisfies { field: keyof EstimateDraft; label: string; enabled: boolean }[]).map(({ field, label, enabled }) => (
            <label key={field} className="flex items-start gap-3 rounded-lg border border-sg-600/40 p-3 text-sm text-text">
              <input type="checkbox" checked={Boolean(draft[field])} disabled={!enabled} onChange={(event) => setField(field, event.target.checked as never)} className="mt-0.5 h-4 w-4 accent-amber-500" />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-sg-600/40 pt-4">
          <div className="text-sm text-text-muted">Current status: <strong className="text-text">{estimateStatusLabel[draft.status]}</strong></div>
          <PdfExportButton createDocument={async () => { const { EstimatePdf } = await import('./EstimatePdf'); return <EstimatePdf draft={{ ...draft, status: deriveEstimateStatus(draft) }} /> }} filename="emaas-job-estimate-draft.pdf" label="Generate Estimate PDF" />
        </div>
      </Card>
    </div>
  )
}
