import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
  beforeEach(() => window.localStorage.clear())

  const renderTempPower = () => render(<MemoryRouter><TempPowerWizard /></MemoryRouter>)

  it('renders the SG-owned data-center dashboard language and operating variables', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Energy Management as a Service (EMaaS) Pro')).toBeInTheDocument()
    expect(screen.getByText('EMaaS Pro Power Console')).toBeInTheDocument()
    expect(screen.getByText('Data center centric')).toBeInTheDocument()
    expect(screen.getByText('Operating Variables Covered')).toBeInTheDocument()
    expect(screen.getByText('Service Cadence')).toBeInTheDocument()
  })

  it('renders temporary power commercial fields used in EMaaS reports', () => {
    renderTempPower()

    expect(screen.queryByText('Client / Account')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Review worked example inputs' }))

    expect(screen.getByText('Client / Account')).toBeInTheDocument()
    expect(screen.getByText('Project / Phase')).toBeInTheDocument()
    expect(screen.getByText('Source Voltage')).toBeInTheDocument()
    expect(screen.getByText('Load Voltage')).toBeInTheDocument()
    expect(screen.getByText('Continuity Need')).toBeInTheDocument()
    expect(screen.queryByText('PM Service Interval')).not.toBeInTheDocument()
    expect(screen.queryByText('Night Noise Fine')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Rental Period')).toBeInTheDocument()
    expect(screen.getByLabelText('Operating Schedule')).toBeInTheDocument()
    expect(screen.getAllByText('672 scheduled hours').length).toBeGreaterThanOrEqual(1)
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.getByRole('heading', { name: 'Temporary Power Planning Brief' })).toBeInTheDocument()
    expect(screen.getByText('Planning brief ready for review')).toBeInTheDocument()
    expect(screen.getByText('Calculation check passed')).toBeInTheDocument()
    expect(screen.getByText(/5 of 5 arithmetic checks agree/i)).toBeInTheDocument()
    expect(screen.getByText(/internal arithmetic only/i)).toBeInTheDocument()
    expect(screen.getByText('Equipment comes after verification')).toBeInTheDocument()
    expect(screen.getByText('Planning Path')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Print Draft' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Draft' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Share Draft' })).toBeInTheDocument()
    expect(screen.getByText('Why Not Size to the Breaker Panel?')).toBeInTheDocument()
    expect(screen.queryByText('Recommended Package')).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Technical One-Line' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: '3D Site Layout' })).not.toBeInTheDocument()
    expect(screen.queryByText('Copy Mermaid')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Mermaid one-line diagram source')).not.toBeInTheDocument()
  })

  it('maps rental duration to runtime and reveals cooling only when selected', () => {
    renderTempPower()

    fireEvent.click(screen.getByRole('button', { name: 'Use as My Starting Point' }))
    fireEvent.click(screen.getByRole('button', { name: 'Single Load' }))
    expect(screen.queryByLabelText('Cooling Equipment Demand')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Rental Period'), { target: { value: 'weekly' } })
    fireEvent.change(screen.getByLabelText('Number of Rental Periods'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Operating Schedule'), { target: { value: 'shift_8' } })
    expect(screen.getAllByText('112 scheduled hours').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('14 rental days × 8 hours/day')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Power + Cooling' }))
    expect(screen.getByLabelText('Cooling Equipment Demand')).toBeInTheDocument()
    expect(screen.getByLabelText('Cooling Capacity')).toBeInTheDocument()
    expect(screen.queryByLabelText('Target Temperature')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Conditioned Area')).not.toBeInTheDocument()
  })

  it('loads the 56 kW jobsite trailer example with a 28-day rental cycle', () => {
    renderTempPower()

    expect(screen.getByText('Worked Example')).toBeInTheDocument()
    expect(screen.getByText(/no equipment package has been selected/i)).toBeInTheDocument()
    expect(screen.getByText('Field Verification')).toBeInTheDocument()
    expect(screen.queryByText('RV Service')).not.toBeInTheDocument()
    expect(screen.getByText('Motor / Compressor Starting')).toBeInTheDocument()
    expect(screen.getAllByText('672 scheduled hours').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('1 28-day cycle').length).toBeGreaterThanOrEqual(1)
  })

  it('stops labeling the plan as the 56 kW worked example after an input changes', () => {
    renderTempPower()

    fireEvent.click(screen.getByRole('button', { name: 'Review worked example inputs' }))
    fireEvent.change(screen.getByLabelText('Planned Load'), { target: { value: '32' } })
    fireEvent.change(screen.getByLabelText('Client / Account'), { target: { value: 'Regression Account' } })
    fireEvent.change(screen.getByLabelText('Project / Phase'), { target: { value: '32 kW Review' } })
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))

    expect(screen.getByText('32.0 kW entered')).toBeInTheDocument()
    expect(screen.queryByText('Worked Example')).not.toBeInTheDocument()
    expect(screen.queryByText(/This 56 kW jobsite example/i)).not.toBeInTheDocument()
  })

  it('persists a customized temporary-power draft across remounts', () => {
    const first = renderTempPower()
    fireEvent.click(screen.getByRole('button', { name: 'Review worked example inputs' }))
    fireEvent.change(screen.getByLabelText('Client / Account'), { target: { value: 'Persistent Account' } })
    fireEvent.change(screen.getByLabelText('Project / Phase'), { target: { value: 'North Yard' } })
    fireEvent.change(screen.getByLabelText('Planned Load'), { target: { value: '42' } })
    first.unmount()

    renderTempPower()
    fireEvent.click(screen.getByRole('button', { name: 'Review temporary power inputs' }))
    expect(screen.getByLabelText('Client / Account')).toHaveValue('Persistent Account')
    expect(screen.getByLabelText('Project / Phase')).toHaveValue('North Yard')
    expect(screen.getByLabelText('Planned Load')).toHaveValue(42)
  })

  it('adds a sourced jobsite trailer model without inferring its operating load', () => {
    renderTempPower()

    fireEvent.click(screen.getByRole('button', { name: 'Review worked example inputs' }))
    fireEvent.click(screen.getByRole('button', { name: 'Base Camp / Multi-Facility' }))
    fireEvent.change(screen.getByLabelText('Jobsite Trailer Model'), {
      target: { value: 'mobile-modular-2161-8x20' },
    })

    expect(screen.getByText(/Mobile Modular 8' x 20' WMS Office, Model 2161/)).toBeInTheDocument()
    expect(screen.getAllByLabelText('Planned Load').some((input) => (input as HTMLInputElement).value === '0')).toBe(true)
    expect(screen.getByText('Manufacturer context:')).toBeInTheDocument()
    expect(screen.getByText(/No operating load is inferred from the service rating/i)).toBeInTheDocument()
    expect(screen.getByText(/Enter a load greater than 0 kW from a schedule, submittal, or nameplate/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Mobile Modular electrical FAQ/i })).toHaveAttribute(
      'href',
      'https://www.mobilemodular.com/resources/frequently-asked-questions',
    )
  })

  it('blocks the planning brief when a rental or load input is invalid', () => {
    renderTempPower()

    fireEvent.click(screen.getByRole('button', { name: 'Review worked example inputs' }))
    fireEvent.change(screen.getByLabelText('Number of Rental Periods'), { target: { value: '-2' } })

    expect(screen.getByLabelText('Number of Rental Periods')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Enter a whole number of rental periods, 1 or greater.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Number of Rental Periods'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Client / Account'), { target: { value: 'Validation Account' } })
    fireEvent.change(screen.getByLabelText('Project / Phase'), { target: { value: 'Validation Review' } })
    expect(screen.getByRole('button', { name: 'Done' })).toBeEnabled()
  })

  it('renders hybrid energy fields at commissioning scale', () => {
    render(<HybridEnergyWizard />)

    expect(screen.getByText('Hybrid EMaaS Strategy - BESS + Generator')).toBeInTheDocument()
    expect(screen.getByText('Client / Account')).toBeInTheDocument()
    expect(screen.getByText('Project / Phase')).toBeInTheDocument()
    expect(screen.getByText('Peak Load Demand')).toBeInTheDocument()
    expect(screen.getByText('Power Zones (Optional)', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Streamlined Hybrid Spec')).toBeInTheDocument()
    expect(screen.getByText('Full 24/7 fallback ready')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Hybrid Energy One-Line Diagram' })).toBeInTheDocument()
    expect(screen.getByText('Printable Electrical One-Line')).toBeInTheDocument()
    expect(screen.getByText('For engineering review')).toBeInTheDocument()
    expect(screen.getByLabelText('Mermaid one-line diagram source')).toBeInTheDocument()
    expect(screen.getByText('Source + Branch Cable Schedule')).toBeInTheDocument()
    expect(screen.getByText('Conceptual 3D equipment envelope')).toBeInTheDocument()
    expect(screen.getByText('Budgetary Estimate Basis')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open Synced Site Fit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Package to Estimate' })).toBeInTheDocument()
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
