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

    expect(screen.getByText('Client / Account')).toBeInTheDocument()
    expect(screen.getByText('Project / Phase')).toBeInTheDocument()
    expect(screen.getByText('PM Service Interval')).toBeInTheDocument()
    expect(screen.getByText('Technician Coverage')).toBeInTheDocument()
    expect(screen.getByText('Containment Required')).toBeInTheDocument()
    expect(screen.getByText('Night Noise Fine')).toBeInTheDocument()
    expect(screen.getByText('PM Service Events')).toBeInTheDocument()
    expect(screen.getByText('Temporary Power One-Line Diagram')).toBeInTheDocument()
    expect(screen.getByText('Copy Mermaid')).toBeInTheDocument()
    expect(screen.getByLabelText('Mermaid one-line diagram source')).toBeInTheDocument()
  })

  it('loads the temporary housing workshop scenario with field risk review outputs', () => {
    render(<TempPowerWizard />)

    fireEvent.click(screen.getByRole('button', { name: 'Load Temp Housing Scenario' }))

    expect(screen.getByText('Field Risk Review')).toBeInTheDocument()
    expect(screen.getByText('Low confidence')).toBeInTheDocument()
    expect(screen.getByText('Adjusted Planning Load')).toBeInTheDocument()
    expect(screen.getByText('Risk-Adjusted Generator')).toBeInTheDocument()
    expect(screen.getByText('Field Risk Contingency')).toBeInTheDocument()
    expect(screen.getByText('Confirm RV pedestal mix: 30A, 50A, mixed, and whether true 120/240V service is required.')).toBeInTheDocument()
    expect(screen.getByText('Confirm compressor and pump horsepower, LRA, start method, and whether starts can be sequenced.')).toBeInTheDocument()
  })

  it('renders hybrid energy fields at commissioning scale', () => {
    render(<HybridEnergyWizard />)

    expect(screen.getByText('Hybrid EMaaS Strategy - BESS + Generator')).toBeInTheDocument()
    expect(screen.getByText('Client / Account')).toBeInTheDocument()
    expect(screen.getByText('Project / Phase')).toBeInTheDocument()
    expect(screen.getByText('Peak Load Demand')).toBeInTheDocument()
    expect(screen.getByText('Power Zones (Optional)', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Hybrid Energy One-Line Diagram')).toBeInTheDocument()
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
