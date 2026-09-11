import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import SiteFitPage from './SiteFitPage'

describe('Site Fit & One-Line', () => {
  beforeEach(() => window.localStorage.clear())

  it('presents the linked site and electrical planning view', () => {
    render(<SiteFitPage />)

    expect(screen.getByText('Dimensioned site board')).toBeInTheDocument()
    expect(screen.getByText('Linked one-line')).toBeInTheDocument()
    expect(screen.getByText('Space-to-power check')).toBeInTheDocument()
    expect(screen.getByText(/Required because the source bus is 480 V/)).toBeInTheDocument()
  })

  it('removes the transformer when source and load voltages match', () => {
    render(<SiteFitPage />)
    fireEvent.change(screen.getByLabelText('Load voltage'), { target: { value: '480' } })

    expect(screen.queryByRole('button', { name: /Step-Down Transformer/ })).not.toBeInTheDocument()
    expect(screen.getByText('Not shown because source and load voltage are both 480 V.')).toBeInTheDocument()
  })

  it('links one-line selection to the equipment explanation', () => {
    render(<SiteFitPage />)
    const transformerButtons = screen.getAllByRole('button', { name: /Transformer Bank/ })
    fireEvent.click(transformerButtons[transformerButtons.length - 1])

    expect(screen.getByText('XFMR-1 · Step-Down Transformer Bank')).toBeInTheDocument()
  })

  it('turns a constrained boundary into a customer-facing power limit', () => {
    render(<SiteFitPage />)
    fireEvent.change(screen.getByLabelText('Length'), { target: { value: '55' } })
    fireEvent.change(screen.getByLabelText('Width'), { target: { value: '35' } })

    expect(screen.getByText('Site constraint limits the requested package')).toBeInTheDocument()
    expect(screen.getByText(/entered site can conservatively support about/)).toBeInTheDocument()
  })

  it('supports focused site and one-line views', () => {
    render(<SiteFitPage />)
    fireEvent.click(screen.getByRole('button', { name: 'One-line only' }))

    expect(screen.queryByText('Dimensioned site board')).not.toBeInTheDocument()
    expect(screen.getByText('Linked one-line')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Site layout' }))
    expect(screen.getByText('Dimensioned site board')).toBeInTheDocument()
    expect(screen.queryByText('Linked one-line')).not.toBeInTheDocument()
  })

  it('withholds a fit conclusion and cable package for zero load', () => {
    render(<SiteFitPage />)
    fireEvent.change(screen.getByLabelText('Requested power'), { target: { value: '0' } })

    expect(screen.getByText('Enter a requested power load')).toBeInTheDocument()
    expect(screen.queryByText(/requires 0 planning runs\/phase/)).not.toBeInTheDocument()
    expect(screen.getByText('Awaiting load')).toBeInTheDocument()
    expect(screen.getByText('Withheld')).toBeInTheDocument()
    expect(screen.queryByText('Transformer')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Generator,/ })).not.toBeInTheDocument()
  })
})
