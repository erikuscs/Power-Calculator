import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HeatingPage from './HeatingPage'

vi.mock('@react-pdf/renderer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@react-pdf/renderer')>()
  return {
    ...actual,
    PDFDownloadLink: ({ children }: { children: (state: { loading: boolean }) => ReactNode }) => (
      <>{children({ loading: false })}</>
    ),
  }
})

describe('Temporary Heating Plan', () => {
  beforeEach(() => window.localStorage.clear())

  it('starts with the propane workflow and hides electric-only demand', () => {
    render(<MemoryRouter><HeatingPage /></MemoryRouter>)

    expect(screen.getByRole('button', { name: 'Propane Heater' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Propane at Full Fire')).toBeInTheDocument()
    expect(screen.getByText('Auxiliary Generator Allowance')).toBeInTheDocument()
    expect(screen.queryByText('Electric Heater Demand')).not.toBeInTheDocument()
  })

  it('reveals the electric path and calculates the generator requirement automatically', () => {
    render(<MemoryRouter><HeatingPage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Electric Heater' }))

    expect(screen.getByText('Electric Heater Demand')).toBeInTheDocument()
    expect(screen.getByText('Generator Planning Load')).toBeInTheDocument()
    expect(screen.getByText('Generator Planning Rating')).toBeInTheDocument()
    expect(screen.queryByLabelText('Propane Heater Type')).not.toBeInTheDocument()
  })

  it('records a requested solution without using it as a sizing input', () => {
    render(<MemoryRouter><HeatingPage /></MemoryRouter>)
    const requiredHeatBefore = screen.getByText('135,000')
    fireEvent.change(screen.getByLabelText('Customer-Requested Solution'), { target: { value: 'Use what we rented last year' } })

    expect(requiredHeatBefore).toBeInTheDocument()
    expect(screen.getByText('135,000')).toBeInTheDocument()
  })
})
