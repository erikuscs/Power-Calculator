import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EstimatePage from './EstimatePage'
import { ESTIMATE_DRAFT_KEY, emptyEstimateDraft } from './estimateDraft'

vi.mock('@react-pdf/renderer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@react-pdf/renderer')>()
  return { ...actual, PDFDownloadLink: ({ children }: { children: (state: { loading: boolean }) => ReactNode }) => <>{children({ loading: false })}</> }
})

describe('Build Estimate', () => {
  beforeEach(() => window.localStorage.clear())

  it('builds commercial line totals and persists the draft', () => {
    render(<MemoryRouter><EstimatePage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Client / Account'), { target: { value: 'Acme' } })
    fireEvent.click(screen.getByRole('button', { name: /Add line/i }))
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Indirect heater' } })
    fireEvent.change(screen.getByLabelText('Model / SKU'), { target: { value: 'IDF-400' } })
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Rate'), { target: { value: '500' } })
    fireEvent.change(screen.getByLabelText('Periods'), { target: { value: '3' } })
    expect(screen.getAllByText('$3,000.00').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Discount Amount')).toBeInTheDocument()
    expect(screen.getByText('Tax Amount')).toBeInTheDocument()
    expect(window.localStorage.getItem(ESTIMATE_DRAFT_KEY)).toContain('IDF-400')
  })

  it('does not allow technical or commercial approval before required quote context exists', () => {
    render(<MemoryRouter><EstimatePage /></MemoryRouter>)
    expect(screen.getByLabelText(/Technical reviewer approved/i)).toBeDisabled()
    expect(screen.getByLabelText(/Equipment availability and current rates/i)).toBeDisabled()
    expect(screen.getAllByText('Needs confirmation').length).toBeGreaterThanOrEqual(1)
  })

  it('loads an imported calculator requirement', () => {
    window.localStorage.setItem(ESTIMATE_DRAFT_KEY, JSON.stringify({
      ...emptyEstimateDraft,
      planningRequirements: [{ id: 'heat-1', source: 'heating', title: 'Temporary Heating Requirement', summary: '2 heaters', details: [{ label: 'Capacity', value: '300,000 BTU/hr' }], assumptions: [], importedAt: new Date().toISOString() }],
    }))
    render(<MemoryRouter><EstimatePage /></MemoryRouter>)
    expect(screen.getByText('Temporary Heating Requirement')).toBeInTheDocument()
    expect(screen.getByText('300,000 BTU/hr')).toBeInTheDocument()
  })
})
