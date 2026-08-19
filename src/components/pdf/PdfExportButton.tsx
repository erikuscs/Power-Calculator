import { useState } from 'react'
import type { ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import { Download } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export interface PdfExportButtonProps {
  createDocument: () => Promise<ReactElement<DocumentProps>>
  filename: string
  label?: string
}

const buttonClasses =
  'inline-flex items-center gap-2 rounded-lg border border-accent-400/50 bg-accent-500 px-5 py-2.5 text-sm font-bold text-sg-900 shadow-lg shadow-black/20 transition-colors hover:bg-accent-400 disabled:cursor-wait disabled:opacity-70'

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      resolve(dataUrl.substring(dataUrl.indexOf(',') + 1))
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.hidden = true
  window.document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function PdfExportButton({
  createDocument,
  filename,
  label = 'Generate EMaaS PDF',
}: PdfExportButtonProps) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportPdf = async () => {
    setGenerating(true)
    setError(null)
    try {
      const [{ pdf }, document] = await Promise.all([
        import('@react-pdf/renderer'),
        createDocument(),
      ])
      const blob = await pdf(document).toBlob()

      if (Capacitor.isNativePlatform()) {
        const data = await blobToBase64(blob)
        const file = await Filesystem.writeFile({
          path: filename,
          data,
          directory: Directory.Cache,
        })
        await Share.share({ title: filename, url: file.uri })
      } else {
        downloadBlob(blob, filename)
      }
    } catch (err) {
      if ((err as Error)?.message !== 'Share canceled') {
        console.error('PDF export failed', err)
        setError('Unable to generate the PDF. Please try again.')
      }
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" className={buttonClasses} disabled={generating} onClick={exportPdf}>
        <Download size={16} />
        {generating ? 'Generating...' : label}
      </button>
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
    </div>
  )
}
