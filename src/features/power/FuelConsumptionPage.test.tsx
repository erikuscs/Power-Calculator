import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { DIESEL_GENERATOR_SIZES_KW } from '../../lib/dieselFuelCurve'
import FuelConsumptionPage from './FuelConsumptionPage'

describe('FuelConsumptionPage', () => {
  beforeEach(() => window.localStorage.clear())

  it('limits generator capacity to the governed reference sizes', () => {
    render(<FuelConsumptionPage />)

    const select = screen.getByLabelText('Generator Rated Capacity')
    const optionValues = within(select).getAllByRole('option').map((option) => (
      (option as HTMLOptionElement).value
    ))

    expect(optionValues).toEqual(DIESEL_GENERATOR_SIZES_KW.map(String))
    expect(optionValues).not.toContain('45')
    expect(optionValues).not.toContain('80')
    expect(optionValues).not.toContain('700')
  })

  it('uses supplier-neutral reference language', () => {
    render(<FuelConsumptionPage />)

    expect(screen.getByText(/governed reference size\/load curve/i)).toBeInTheDocument()
    expect(document.body.textContent?.toLowerCase()).not.toContain(['sun', 'belt'].join(''))
  })
})
