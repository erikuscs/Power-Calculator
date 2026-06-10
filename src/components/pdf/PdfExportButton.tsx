import { PDFDownloadLink } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'
import { Download } from 'lucide-react'

export interface PdfExportButtonProps {
  document: ReactElement<DocumentProps>
  filename: string
  label?: string
}

export function PdfExportButton({ document, filename, label = 'Generate EMaaS PDF' }: PdfExportButtonProps) {
  return (
    <PDFDownloadLink document={document} fileName={filename}>
      {({ loading }) => (
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-accent-400/50 bg-accent-500 px-5 py-2.5 text-sm font-bold text-sg-900 shadow-lg shadow-black/20 transition-colors hover:bg-accent-400 disabled:cursor-wait disabled:opacity-70"
          disabled={loading}
        >
          <Download size={16} />
          {loading ? 'Generating...' : label}
        </button>
      )}
    </PDFDownloadLink>
  )
}
