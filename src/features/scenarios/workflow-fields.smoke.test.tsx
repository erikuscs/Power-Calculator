import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import DashboardPage from '../dashboard/DashboardPage'
import TempPowerWizard from './TempPowerWizard'
import HybridEnergyWizard from './HybridEnergyWizard'
import BessProjectWizard from './BessProjectWizard'
import HvacAssessmentWizard from './HvacAssessmentWizard'

vi.mock('@react-pdf/renderer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@react-pdf/renderer')>()
  return {
    ...actual,
    PDFDownloadLink: ({ children }: { children: (state: { loading: boolean }) => ReactNode }) => (
      <>{children({ loading: false })}</>
    ),
  }
})

describe('EMaaS workflow field smoke tests', () => {
  it('renders the SG-owned data-center dashboard language and operating variables', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('EMaaS Power Console')).toBeInTheDocument()
    expect(screen.getByText('Data center centric')).toBeInTheDocument()
    expect(screen.getByText('Operating Variables Covered')).toBeInTheDocument()
    expect(screen.getByText('Service Cadence')).toBeInTheDocument()
  })

  it('renders temporary power commercial fields used in EMaaS reports', () => {
    render(<TempPowerWizard />)

    expect(screen.queryByText('Client / Account')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Requirements selected/i }))

    expect(screen.getByText('Client / Account')).toBeInTheDocument()
    expect(screen.getByText('Project / Phase')).toBeInTheDocument()
    expect(screen.getByText('PM Service Interval')).toBeInTheDocument()
    expect(screen.getByText('Technician Coverage')).toBeInTheDocument()
    expect(screen.getByText('Containment Required')).toBeInTheDocument()
    expect(screen.getByText('Night Noise Fine')).toBeInTheDocument()
    expect(screen.getByLabelText('Rental Period')).toBeInTheDocument()
    expect(screen.getByLabelText('Operating Schedule')).toBeInTheDocument()
    expect(screen.getAllByText('240 operating hours').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('heading', { name: 'Recommended Energy Plan' })).toBeInTheDocument()
    expect(screen.getByText('Recommended Package')).toBeInTheDocument()
    expect(screen.getByText('Why this fits')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Temporary Power One-Line Diagram printable electrical one-line diagram/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Print' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save PDF' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Share PDF' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '3D Site Layout' })).toBeInTheDocument()
    expect(screen.getByText('Why Not Size to the Breaker Panel?')).toBeInTheDocument()
    expect(screen.queryByText('Copy Mermaid')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Mermaid one-line diagram source')).not.toBeInTheDocument()
  })

  it('maps rental duration to runtime and reveals cooling only when selected', () => {
    render(<TempPowerWizard />)

    fireEvent.click(screen.getByRole('button', { name: /Requirements selected/i }))
    expect(screen.queryByLabelText('Target Temperature')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Rental Period'), { target: { value: 'weekly' } })
    fireEvent.change(screen.getByLabelText('Number of Rental Periods'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Operating Schedule'), { target: { value: 'shift_8' } })
    expect(screen.getAllByText('112 operating hours').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('14 rental days × 8 hours/day')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add Temporary Cooling' }))
    expect(screen.getByLabelText('Target Temperature')).toBeInTheDocument()
    expect(screen.getByLabelText('Conditioned Area')).toBeInTheDocument()
  })

  it('loads the temporary housing workshop scenario with field risk review outputs', () => {
    render(<TempPowerWizard />)

    fireEvent.click(screen.getByRole('button', { name: /Requirements selected/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Use Example Scenario' }))

    expect(screen.getByText(/Low confidence -/)).toBeInTheDocument()
    expect(screen.getByText('Field Verification')).toBeInTheDocument()
    expect(screen.getByText('RV Service')).toBeInTheDocument()
    expect(screen.getByText('Motor / Compressor Starting')).toBeInTheDocument()
    expect(screen.getByText(/field checks remain open/i)).toBeInTheDocument()
  })

  it('renders hybrid energy fields at commissioning scale', () => {
    render(<HybridEnergyWizard />)

    expect(screen.getByText('Hybrid EMaaS Strategy - BESS + Generator')).toBeInTheDocument()
    expect(screen.getByText('Client / Account')).toBeInTheDocument()
    expect(screen.getByText('Project / Phase')).toBeInTheDocument()
    expect(screen.getByText('Peak Load Demand')).toBeInTheDocument()
    expect(screen.getByText('Power Zones (Optional)', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Streamlined Hybrid Spec')).toBeInTheDocument()
    expect(screen.getByText('24/7 hybrid ready')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Hybrid Energy One-Line Diagram' })).toBeInTheDocument()
    expect(screen.getByText('Printable Electrical One-Line')).toBeInTheDocument()
    expect(screen.getByText('For engineering review')).toBeInTheDocument()
    expect(screen.getByLabelText('Mermaid one-line diagram source')).toBeInTheDocument()
  })

  it('renders report context fields on BESS economics and cooling workflows', () => {
    render(<BessProjectWizard />)
    expect(screen.getByText('Shown on the exported EMaaS economics package')).toBeInTheDocument()
    expect(screen.getByText('Client / Account')).toBeInTheDocument()

    render(<HvacAssessmentWizard />)
    expect(screen.getByText('Shown on the exported EMaaS cooling package')).toBeInTheDocument()
    expect(screen.getAllByText('Project / Phase').length).toBeGreaterThanOrEqual(2)
  })
})
