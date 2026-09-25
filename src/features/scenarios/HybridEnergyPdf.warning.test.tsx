import type { PropsWithChildren } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { calculateHybridWizard, type HybridWizardInputs } from './scenario.formulas'
import { HybridEnergyPdfDoc } from './HybridEnergyPdf'

vi.mock('@react-pdf/renderer', () => ({
  Text: ({ children }: PropsWithChildren) => <span>{children}</span>,
}))

vi.mock('../../components/pdf/PdfReportShell', () => ({
  PdfDocument: ({ children }: PropsWithChildren) => <div>{children}</div>,
  PdfSection: ({ children }: PropsWithChildren) => <section>{children}</section>,
  PdfWarning: ({ children }: { children: string }) => <div>{children}</div>,
  PdfKeyValue: ({ label, value }: { label: string; value: string }) => <div>{label}: {value}</div>,
  PdfTable: ({ rows }: { rows: (string | number)[][] }) => <div>{rows.flat().join(' | ')}</div>,
}))

const inputs: HybridWizardInputs = {
  peakLoadKw: 600,
  baseLoadKw: 400,
  loadSource: 'measured',
  bessUnitSize: 250,
  peakHoursPerDay: 8,
  projectDurationDays: 28,
  redundancy: 'n',
  siteVoltage: 480,
  loadVoltage: 480,
  altitude: 0,
  ambientTemp: 85,
  fuelCostPerGallon: 8.5,
  bessRentalPerDay: 0,
  genRentalPerDay: 0,
  startDate: '2026-09-24',
  endDate: '2026-10-22',
  motors: [],
  powerFactor: 0.8,
}

describe('HybridEnergyPdf benchmark warnings', () => {
  it('renders the no-maintenance-reserve red flag in the report', () => {
    render(<HybridEnergyPdfDoc inputs={inputs} results={calculateHybridWizard(inputs)} />)

    expect(screen.getByText(/RED FLAG: Multiple generators reduce source concentration, but no unit can be removed for maintenance/i)).toBeInTheDocument()
  })
})
