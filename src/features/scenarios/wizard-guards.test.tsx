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
  function enterValidAmpFirstInputs() {
    fireEvent.change(screen.getByLabelText('Peak Current'), { target: { value: '2000' } })
    fireEvent.change(screen.getByLabelText('Continuous Current'), { target: { value: '500' } })
    fireEvent.change(screen.getByLabelText('Voltage'), { target: { value: '480' } })
    fireEvent.change(screen.getByLabelText('Phase'), { target: { value: 'three' } })
    fireEvent.change(screen.getByLabelText('Power Factor'), { target: { value: '0.8' } })
  }

  it('starts blank and makes no package claim before the customer inputs are complete', () => {
    render(<HybridEnergyWizard />)
    expect(screen.getByLabelText('Peak Current')).toHaveValue(null)
    expect(screen.getByLabelText('Continuous Current')).toHaveValue(null)
    expect(screen.getByLabelText('Voltage')).toHaveValue('')
    expect(screen.getByLabelText('Phase')).toHaveValue('')
    expect(screen.getByLabelText('Power Factor')).toHaveValue(null)
    expect(screen.queryByText('Automatically Selected Package')).toBeNull()
  })

  it('automatically selects two 250 kW BESS and three 500 kW generators for the approved example', () => {
    render(<HybridEnergyWizard />)
    enterValidAmpFirstInputs()
    expect(screen.getByText('Automatically Selected Package')).toBeInTheDocument()
    expect(screen.getByText('2 × 250 kW')).toBeInTheDocument()
    expect(screen.getByText('3 × 500 kW')).toBeInTheDocument()
    expect(screen.queryByText('Financial Comparison')).toBeNull()
    expect(screen.queryByText('Daily Fuel')).toBeNull()
  })

  it('blocks a continuous current above peak current', () => {
    render(<HybridEnergyWizard />)
    enterValidAmpFirstInputs()
    fireEvent.change(screen.getByLabelText('Continuous Current'), { target: { value: '2100' } })
    expect(screen.getByText('Continuous amps cannot exceed peak amps.')).toBeInTheDocument()
    expect(screen.queryByText('Automatically Selected Package')).toBeNull()
  })

  it('returns no package when the governed inventory has no compatible voltage and phase', () => {
    render(<HybridEnergyWizard />)
    fireEvent.change(screen.getByLabelText('Peak Current'), { target: { value: '200' } })
    fireEvent.change(screen.getByLabelText('Continuous Current'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Voltage'), { target: { value: '240' } })
    fireEvent.change(screen.getByLabelText('Phase'), { target: { value: 'three' } })
    fireEvent.change(screen.getByLabelText('Power Factor'), { target: { value: '0.8' } })
    expect(screen.getByText(/No electrically compatible BESS/)).toBeInTheDocument()
    expect(screen.queryByText('Automatically Selected Package')).toBeNull()
  })

  it('calculates one exact 28-day equipment total from the two quoted unit rates', () => {
    render(<HybridEnergyWizard />)
    enterValidAmpFirstInputs()
    fireEvent.change(screen.getByLabelText('Selected BESS 28-Day Rate'), { target: { value: '9800' } })
    fireEvent.change(screen.getByLabelText('Selected Generator 28-Day Rate'), { target: { value: '14000' } })
    expect(screen.getAllByText('$61,600').length).toBeGreaterThan(0)
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
