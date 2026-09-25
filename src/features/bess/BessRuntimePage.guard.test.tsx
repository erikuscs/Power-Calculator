import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BessRuntimePage from './BessRuntimePage'

vi.mock('@react-pdf/renderer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@react-pdf/renderer')>()
  return {
    ...actual,
    PDFDownloadLink: ({ children }: { children: (state: { loading: boolean }) => ReactNode }) => (
      <>{children({ loading: false })}</>
    ),
  }
})

describe('BessRuntimePage continuous-load guards', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows results for valid continuous-load inputs', () => {
    render(
      <MemoryRouter initialEntries={['/bess/runtime']}>
        <BessRuntimePage />
      </MemoryRouter>,
    )
    expect(screen.getAllByText('Estimated Runtime').length).toBeGreaterThan(0)
  })

  it('rejects a usable energy window above 100% injected via URL state', () => {
    render(
      <MemoryRouter initialEntries={['/bess/runtime?usable=105']}>
        <BessRuntimePage />
      </MemoryRouter>,
    )
    expect(screen.queryByText('Estimated Runtime')).toBeNull()
    expect(screen.getByRole('alert')).toHaveTextContent(/Usable energy window must be greater than 0% and no more than 100%/i)
  })

  it('rejects a negative continuous load injected via URL state', () => {
    render(
      <MemoryRouter initialEntries={['/bess/runtime?loadKw=-10']}>
        <BessRuntimePage />
      </MemoryRouter>,
    )
    expect(screen.queryByText('Estimated Runtime')).toBeNull()
    expect(screen.getByRole('alert')).toHaveTextContent(/Battery capacity and continuous load must both be greater than zero/i)
  })

  it('rejects zero delivery efficiency instead of silently replacing it with the default', () => {
    render(
      <MemoryRouter initialEntries={['/bess/runtime?efficiency=0']}>
        <BessRuntimePage />
      </MemoryRouter>,
    )
    expect(screen.queryByText('Estimated Runtime')).toBeNull()
    expect(screen.getByRole('alert')).toHaveTextContent(/Delivery efficiency must be greater than 0% and no more than 100%/i)
  })

  it('flags legacy voltage/current/power-factor deep links instead of silently reusing them', () => {
    render(
      <MemoryRouter initialEntries={['/bess/runtime?v=48&a=50&pf=0.8']}>
        <BessRuntimePage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(/legacy runtime link used voltage, current, or power factor/i)
  })
})
