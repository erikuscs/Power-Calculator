import { useState } from 'react'
import { PDFDownloadLink, pdf } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import { Download } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export interface PdfExportButtonProps {
  document: ReactElement<DocumentProps>
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

/** On native iOS/Android, blob-download anchors do nothing inside the WebView,
 * so the PDF is written to the app cache and handed to the native share sheet. */
function NativePdfExportButton({ document, filename, label }: Required<PdfExportButtonProps>) {
  const [generating, setGenerating] = useState(false)

  const exportPdf = async () => {
    setGenerating(true)
    try {
      const blob = await pdf(document).toBlob()
      const data = await blobToBase64(blob)
      const file = await Filesystem.writeFile({
        path: filename,
        data,
        directory: Directory.Cache,
      })
      await Share.share({ title: filename, url: file.uri })
    } catch (err) {
      if ((err as Error)?.message !== 'Share canceled') {
        console.error('PDF export failed', err)
      }
    } finally {
      setGenerating(false)
    }
  }

  return (
    <button type="button" className={buttonClasses} disabled={generating} onClick={exportPdf}>
      <Download size={16} />
      {generating ? 'Generating...' : label}
    </button>
  )
}

export function PdfExportButton({ document, filename, label = 'Generate EMaaS PDF' }: PdfExportButtonProps) {
  if (Capacitor.isNativePlatform()) {
    return <NativePdfExportButton document={document} filename={filename} label={label} />
  }

  return (
    <PDFDownloadLink document={document} fileName={filename}>
      {({ loading }) => (
        <button type="button" className={buttonClasses} disabled={loading}>
          <Download size={16} />
          {loading ? 'Generating...' : label}
        </button>
      )}
    </PDFDownloadLink>
  )
}
