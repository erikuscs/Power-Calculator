import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BessRoiPage from './BessRoiPage'

describe('BessRoiPage input guards', () => {
  it('does not silently replace a displayed zero efficiency with 0.85', () => {
    render(<BessRoiPage />)
    fireEvent.change(screen.getByLabelText('Round Trip Efficiency'), { target: { value: '0' } })

    expect(screen.getByRole('alert')).toHaveTextContent(/greater than 0 and no more than 1/i)
    expect(screen.queryByText('Daily Arbitrage Revenue')).not.toBeInTheDocument()
  })

  it('rejects nonpositive cycles', () => {
    render(<BessRoiPage />)
    fireEvent.change(screen.getByLabelText('Cycles per Day'), { target: { value: '0' } })
    expect(screen.getByRole('alert')).toHaveTextContent(/cycles per day/i)
  })

  it('rejects out-of-range degradation', () => {
    render(<BessRoiPage />)
    fireEvent.change(screen.getByLabelText('Degradation Rate'), { target: { value: '1' } })
    expect(screen.getByRole('alert')).toHaveTextContent(/degradation rate/i)
  })
})
