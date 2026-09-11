import { beforeEach, describe, expect, it } from 'vitest'
import {
  ESTIMATE_DRAFT_KEY,
  addPlanningRequirement,
  calculateEstimateTotals,
  deriveEstimateStatus,
  emptyEstimateDraft,
  readEstimateDraft,
} from './estimateDraft'

describe('estimate draft', () => {
  beforeEach(() => window.localStorage.clear())

  it('stores one current planning requirement per calculator source', () => {
    addPlanningRequirement({ source: 'heating', title: 'Heat', summary: 'First', details: [], assumptions: [] })
    addPlanningRequirement({ source: 'heating', title: 'Heat', summary: 'Updated', details: [], assumptions: [] })
    const saved = readEstimateDraft()
    expect(saved.planningRequirements).toHaveLength(1)
    expect(saved.planningRequirements[0].summary).toBe('Updated')
    expect(window.localStorage.getItem(ESTIMATE_DRAFT_KEY)).toContain('Updated')
  })

  it('does not mix calculator results from a different client or project', () => {
    addPlanningRequirement({ source: 'heating', title: 'Heat', summary: 'First', details: [], assumptions: [] }, { clientName: 'Client A', projectName: 'Project A' })
    const added = addPlanningRequirement({ source: 'cooling', title: 'Cool', summary: 'Second', details: [], assumptions: [] }, { clientName: 'Client B', projectName: 'Project B' })
    expect(added).toBe(false)
    expect(readEstimateDraft().planningRequirements).toHaveLength(1)
  })

  it('calculates line totals, discount, and tax without changing planning inputs', () => {
    const draft = {
      ...emptyEstimateDraft,
      discountPercent: 10,
      taxPercent: 5,
      lineItems: [{ id: '1', category: 'equipment' as const, description: 'Heater', modelSku: 'H-1', quantity: 2, rate: 100, periods: 3, rateUnit: 'day' }],
    }
    expect(calculateEstimateTotals(draft)).toEqual({ subtotal: 600, discount: 60, tax: 27, total: 567 })
  })

  it('requires all three explicit gates before approving a quote', () => {
    expect(deriveEstimateStatus({ ...emptyEstimateDraft, scopeConfirmed: true })).toBe('technical_review')
    expect(deriveEstimateStatus({ ...emptyEstimateDraft, scopeConfirmed: true, technicalReviewComplete: true, availabilityAndRatesConfirmed: true })).toBe('approved_for_quote')
  })
})
