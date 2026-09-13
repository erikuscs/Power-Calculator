export const ESTIMATE_DRAFT_KEY = 'power-calc:/estimate:draft'

export type EstimateSource = 'temporary_power' | 'cooling' | 'heating' | 'hybrid'
export type EstimateStatus = 'needs_confirmation' | 'technical_review' | 'approved_for_quote'
export type EstimateLineCategory = 'equipment' | 'accessory' | 'fuel' | 'delivery' | 'labor' | 'service' | 'other'

export interface PlanningRequirement {
  id: string
  source: EstimateSource
  title: string
  summary: string
  details: { label: string; value: string }[]
  assumptions: string[]
  importedAt: string
}

export interface EstimateLineItem {
  id: string
  category: EstimateLineCategory
  description: string
  modelSku: string
  quantity: number
  rate: number
  periods: number
  rateUnit: string
}

export interface EstimateDraft {
  clientName: string
  contactName: string
  projectName: string
  jobsiteAddress: string
  estimatorName: string
  quoteNumber: string
  billingAndPoRequirements: string
  requestedOn: string
  neededBy: string
  validUntil: string
  planningRequirements: PlanningRequirement[]
  lineItems: EstimateLineItem[]
  cableOrDuctDistance: string
  connectionAndDistribution: string
  deliveryAccess: string
  deliveryPickupPlan: string
  placementAndClearance: string
  fuelAndServicePlan: string
  siteRestrictions: string
  commercialTerms: string
  notes: string
  discountPercent: number
  taxPercent: number
  scopeConfirmed: boolean
  technicalReviewComplete: boolean
  availabilityAndRatesConfirmed: boolean
  status: EstimateStatus
}

export const emptyEstimateDraft: EstimateDraft = {
  clientName: '',
  contactName: '',
  projectName: '',
  jobsiteAddress: '',
  estimatorName: '',
  quoteNumber: '',
  billingAndPoRequirements: '',
  requestedOn: '',
  neededBy: '',
  validUntil: '',
  planningRequirements: [],
  lineItems: [],
  cableOrDuctDistance: '',
  connectionAndDistribution: '',
  deliveryAccess: '',
  deliveryPickupPlan: '',
  placementAndClearance: '',
  fuelAndServicePlan: '',
  siteRestrictions: '',
  commercialTerms: '',
  notes: '',
  discountPercent: 0,
  taxPercent: 0,
  scopeConfirmed: false,
  technicalReviewComplete: false,
  availabilityAndRatesConfirmed: false,
  status: 'needs_confirmation',
}

export function readEstimateDraft(): EstimateDraft {
  try {
    const saved = window.localStorage.getItem(ESTIMATE_DRAFT_KEY)
    return saved ? { ...emptyEstimateDraft, ...JSON.parse(saved) } : { ...emptyEstimateDraft }
  } catch {
    return { ...emptyEstimateDraft }
  }
}

export function addPlanningRequirement(
  requirement: Omit<PlanningRequirement, 'id' | 'importedAt'>,
  context?: { clientName?: string; projectName?: string },
  suggestedLineItems?: EstimateLineItem[],
) {
  const draft = readEstimateDraft()
  const contextConflicts = Boolean(
    (draft.clientName && context?.clientName && draft.clientName !== context.clientName)
    || (draft.projectName && context?.projectName && draft.projectName !== context.projectName),
  )
  if (contextConflicts) return false
  const next: PlanningRequirement = {
    ...requirement,
    id: `${requirement.source}-${Date.now()}`,
    importedAt: new Date().toISOString(),
  }
  const withoutSameSource = draft.planningRequirements.filter((item) => item.source !== requirement.source)
  window.localStorage.setItem(ESTIMATE_DRAFT_KEY, JSON.stringify({
    ...draft,
    clientName: draft.clientName || context?.clientName || '',
    projectName: draft.projectName || context?.projectName || '',
    planningRequirements: [...withoutSameSource, next],
    lineItems: suggestedLineItems
      ? [...draft.lineItems.filter((item) => !item.id.startsWith(`${requirement.source}-`)), ...suggestedLineItems]
      : draft.lineItems,
    status: 'needs_confirmation',
    technicalReviewComplete: false,
    availabilityAndRatesConfirmed: false,
  }))
  return true
}

export function calculateEstimateTotals(draft: EstimateDraft) {
  const subtotal = draft.lineItems.reduce((sum, item) => (
    sum + Math.max(0, item.quantity) * Math.max(0, item.rate) * Math.max(0, item.periods)
  ), 0)
  const discount = subtotal * Math.max(0, draft.discountPercent) / 100
  const taxableSubtotal = Math.max(0, subtotal - discount)
  const tax = taxableSubtotal * Math.max(0, draft.taxPercent) / 100
  return { subtotal, discount, tax, total: taxableSubtotal + tax }
}

export function deriveEstimateStatus(draft: EstimateDraft): EstimateStatus {
  if (draft.scopeConfirmed && draft.technicalReviewComplete && draft.availabilityAndRatesConfirmed) {
    return 'approved_for_quote'
  }
  if (draft.scopeConfirmed) return 'technical_review'
  return 'needs_confirmation'
}

export const estimateStatusLabel: Record<EstimateStatus, string> = {
  needs_confirmation: 'Needs confirmation',
  technical_review: 'Ready for technical review',
  approved_for_quote: 'Approved for quote',
}
