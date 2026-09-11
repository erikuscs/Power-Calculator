import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Document } from '@react-pdf/renderer'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PdfActionBar } from './PdfActionBar'

const mocks = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => false),
  pdf: vi.fn(),
  share: vi.fn(),
  writeFile: vi.fn(),
}))

vi.mock('@react-pdf/renderer', () => ({
  Document: () => null,
  pdf: mocks.pdf,
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: mocks.isNativePlatform },
}))

vi.mock('@capacitor/filesystem', () => ({
  Directory: { Cache: 'CACHE' },
  Filesystem: { writeFile: mocks.writeFile },
}))

vi.mock('@capacitor/share', () => ({
  Share: { share: mocks.share },
}))

describe('PdfActionBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.isNativePlatform.mockReturnValue(false)
    mocks.pdf.mockReturnValue({
      toBlob: vi.fn().mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' })),
    })

    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: vi.fn(() => 'blob:report') },
      revokeObjectURL: { configurable: true, value: vi.fn() },
    })
  })

  it('defers document creation and the PDF renderer until an action is requested', async () => {
    const createDocument = vi.fn(async () => <Document />)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    render(
      <PdfActionBar
        createDocument={createDocument}
        filename="review.pdf"
        title="Review"
        shareText="Review package"
      />,
    )

    expect(createDocument).not.toHaveBeenCalled()
    expect(mocks.pdf).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Save PDF' }))

    await waitFor(() => expect(click).toHaveBeenCalledOnce())
    expect(createDocument).toHaveBeenCalledOnce()
    expect(mocks.pdf).toHaveBeenCalledOnce()
    expect(screen.getByText('Review package saved.')).toBeInTheDocument()
  })

  it('reports a blocked print window instead of failing silently', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)

    render(
      <PdfActionBar
        createDocument={async () => <Document />}
        filename="planning-draft.pdf"
        title="Planning Draft"
        shareText="Draft planning brief"
        draft
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Print Draft' }))

    await waitFor(() => expect(screen.getByText(/blocked by the browser/i)).toBeInTheDocument())
    expect(open).toHaveBeenCalledOnce()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:report')
  })

  it('saves the PDF when browser file sharing is unavailable', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: vi.fn(() => false),
    })

    render(
      <PdfActionBar
        createDocument={async () => <Document />}
        filename="planning-draft.pdf"
        title="Planning Draft"
        shareText="Draft planning brief"
        draft
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Share Draft' }))

    await waitFor(() => expect(click).toHaveBeenCalledOnce())
    expect(screen.getByText(/file sharing is not available/i)).toBeInTheDocument()
  })
})
