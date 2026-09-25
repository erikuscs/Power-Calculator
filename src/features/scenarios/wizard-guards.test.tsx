import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import HybridEnergyWizard from './HybridEnergyWizard'
import BessProjectWizard from './BessProjectWizard'

vi.mock('@react-pdf/renderer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@react-pdf/renderer')>()
  return {
    ...actual,
    PDFDownloadLink: ({ children }: { children: (state: { loading: boolean }) => ReactNode }) => (
      <>{children({ loading: false })}</>
    ),
  }
})

describe('HybridEnergyWizard input guards', () => {
  it('shows results with valid default inputs (base <= peak)', () => {
    render(<HybridEnergyWizard />)
    expect(screen.getByText('Financial Comparison')).toBeInTheDocument()
    expect(screen.queryByText('Base load cannot exceed peak load')).toBeNull()
    expect(screen.getByLabelText('Site Voltage')).toHaveValue('480')
    expect(screen.getByLabelText('Load Voltage')).toHaveValue('480')
    expect(screen.getByText('Benchmark architecture check')).toBeInTheDocument()
  })

  it('hides results and flags the field when base load exceeds peak load', () => {
    render(<HybridEnergyWizard />)
    // Defaults: peak 1,200 kW, base 800 kW — invert them.
    fireEvent.change(screen.getByLabelText('Base/Continuous Load'), { target: { value: '1300' } })

    expect(screen.getByText('Base load cannot exceed peak load')).toBeInTheDocument()
    // No invalid fuel-difference or "CO2 Avoided" tables should be rendered
    expect(screen.queryByText('Financial Comparison')).toBeNull()
    expect(screen.queryByText('System Configuration')).toBeNull()
  })

  it('hides results when base load is negative', () => {
    render(<HybridEnergyWizard />)
    fireEvent.change(screen.getByLabelText('Base/Continuous Load'), { target: { value: '-100' } })
    expect(screen.queryByText('Financial Comparison')).toBeNull()
  })

  it('shows the maintenance-reserve warning when redundancy is disabled', () => {
    render(<HybridEnergyWizard />)
    fireEvent.change(screen.getByLabelText('Redundancy Level'), { target: { value: 'n' } })

    expect(screen.getByText('WARNING — modular plant has no standby unit')).toBeInTheDocument()
    expect(screen.getByText(/no unit can be removed for maintenance/i)).toBeInTheDocument()
  })
})

describe('BessProjectWizard sizing guards', () => {
  it('allows advancing with valid default inputs', () => {
    render(<BessProjectWizard />)
    expect(screen.getByRole('button', { name: 'Next: Financial Parameters' })).toBeEnabled()
  })

  it('blocks advancing when system losses >= 100% (would yield negative units)', () => {
    render(<BessProjectWizard />)
    // Default losses value is '5'
    fireEvent.change(screen.getByDisplayValue('5'), { target: { value: '150' } })
    expect(screen.getByRole('button', { name: 'Next: Financial Parameters' })).toBeDisabled()
  })

  it('blocks advancing when depth of discharge exceeds 100%', () => {
    render(<BessProjectWizard />)
    // Default DoD value is '80'
    fireEvent.change(screen.getByDisplayValue('80'), { target: { value: '120' } })
    expect(screen.getByRole('button', { name: 'Next: Financial Parameters' })).toBeDisabled()
  })
})
