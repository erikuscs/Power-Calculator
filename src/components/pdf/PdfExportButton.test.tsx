import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Document } from '@react-pdf/renderer'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PdfExportButton } from './PdfExportButton'

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

describe('PdfExportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.isNativePlatform.mockReturnValue(false)
    mocks.pdf.mockReturnValue({
      toBlob: vi.fn().mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' })),
    })
    mocks.writeFile.mockResolvedValue({ uri: 'file:///report.pdf' })
    mocks.share.mockResolvedValue(undefined)
  })

  it('loads and renders the PDF only after export is requested', async () => {
    const createDocument = vi.fn(async () => <Document />)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const createObjectURL = vi.fn(() => 'blob:report')
    const revokeObjectURL = vi.fn()

    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: createObjectURL },
      revokeObjectURL: { configurable: true, value: revokeObjectURL },
    })

    render(
      <PdfExportButton
        createDocument={createDocument}
        filename="report.pdf"
      />,
    )

    expect(createDocument).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Generate EMaaS PDF' }))

    await waitFor(() => expect(click).toHaveBeenCalledOnce())
    expect(createDocument).toHaveBeenCalledOnce()
    expect(mocks.pdf).toHaveBeenCalledOnce()
    expect(createObjectURL).toHaveBeenCalledOnce()
  })

  it('writes and shares the generated PDF on native platforms', async () => {
    mocks.isNativePlatform.mockReturnValue(true)

    render(
      <PdfExportButton
        createDocument={async () => <Document />}
        filename="report.pdf"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Generate EMaaS PDF' }))

    await waitFor(() => expect(mocks.share).toHaveBeenCalledOnce())
    expect(mocks.writeFile).toHaveBeenCalledWith({
      path: 'report.pdf',
      data: expect.any(String),
      directory: 'CACHE',
    })
    expect(mocks.share).toHaveBeenCalledWith({
      title: 'report.pdf',
      url: 'file:///report.pdf',
    })
  })
})
