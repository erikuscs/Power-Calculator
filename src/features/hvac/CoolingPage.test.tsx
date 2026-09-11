import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CoolingPage from './CoolingPage'

vi.mock('@react-pdf/renderer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@react-pdf/renderer')>()
  return {
    ...actual,
    PDFDownloadLink: ({ children }: { children: (state: { loading: boolean }) => ReactNode }) => (
      <>{children({ loading: false })}</>
    ),
  }
})

describe('CoolingPage facility dimensions', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('keeps square-foot entry as the default facility-size method', () => {
    render(
      <MemoryRouter>
        <CoolingPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Floor Area (sq ft)' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Facility Size')).toHaveValue(2000)
    expect(screen.queryByLabelText('Width')).not.toBeInTheDocument()
  })

  it('derives cubic feet and the calculation footprint from width, height, and depth', () => {
    render(
      <MemoryRouter>
        <CoolingPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Dimensions (cu ft)' }))
    fireEvent.change(screen.getByLabelText('Width'), { target: { value: '30' } })
    fireEvent.change(screen.getByLabelText('Height'), { target: { value: '12' } })
    fireEvent.change(screen.getByLabelText('Depth'), { target: { value: '40' } })

    expect(screen.getByText('14,400 cu ft')).toBeInTheDocument()
    expect(screen.getByText(/1,200 sq ft footprint is used/i)).toBeInTheDocument()
    expect(screen.getByText(/1200 × 23 × 0.5 × 1/)).toBeInTheDocument()
  })

  it('blocks results and export when relative humidity is outside the physical range', () => {
    render(
      <MemoryRouter>
        <CoolingPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Relative Humidity'), { target: { value: '120' } })
    expect(screen.getByText('Relative humidity must be between 0% and 100%.')).toBeInTheDocument()
    expect(screen.queryByText('Recommended (with 15% margin)')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Generate EMaaS PDF' })).not.toBeInTheDocument()
  })

  it('warns when the target temperature is not below ambient', () => {
    render(<MemoryRouter><CoolingPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Target Temperature'), { target: { value: '100' } })
    expect(screen.getByText(/Envelope cooling gain is zero/i)).toBeInTheDocument()
  })
})
