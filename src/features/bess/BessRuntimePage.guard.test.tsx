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

describe('BessRuntimePage power factor guard', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows results for a valid power factor', () => {
    render(
      <MemoryRouter initialEntries={['/bess/runtime']}>
        <BessRuntimePage />
      </MemoryRouter>,
    )
    expect(screen.getByText('Estimated Runtime')).toBeInTheDocument()
  })

  it('rejects power factor > 1 injected via URL state', () => {
    render(
      <MemoryRouter initialEntries={['/bess/runtime?pf=5']}>
        <BessRuntimePage />
      </MemoryRouter>,
    )
    expect(screen.queryByText('Estimated Runtime')).toBeNull()
  })

  it('rejects zero or negative power factor injected via URL state', () => {
    render(
      <MemoryRouter initialEntries={['/bess/runtime?pf=-0.8']}>
        <BessRuntimePage />
      </MemoryRouter>,
    )
    expect(screen.queryByText('Estimated Runtime')).toBeNull()
  })
})
