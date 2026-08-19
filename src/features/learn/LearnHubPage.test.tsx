import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import LearnHubPage from './LearnHubPage'

describe('LearnHubPage', () => {
  it('explains the planning objective and links each guided workflow', () => {
    render(
      <MemoryRouter>
        <LearnHubPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/objective is not to replace engineering design/i)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /start .* tutorial/i })).toHaveLength(4)
    expect(screen.getByRole('link', { name: /start temporary power & cooling tutorial/i })).toHaveAttribute(
      'href',
      '/scenarios/temp-power',
    )
  })
})
