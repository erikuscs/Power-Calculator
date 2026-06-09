import { PDFDownloadLink } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import type { DocumentProps } from '@react-pdf/renderer'

export interface PdfExportButtonProps {
  document: ReactElement<DocumentProps>
  filename: string
  label?: string
}

export function PdfExportButton({ document, filename, label = 'Export PDF' }: PdfExportButtonProps) {
  return (
    <PDFDownloadLink document={document} fileName={filename}>
      {({ loading }) => (
        <button
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            backgroundColor: '#c89a3c',
            color: '#1a1f2e',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 150ms',
          }}
        >
          {/* Simple download SVG icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 1v9m0 0L5 7m3 3 3-3M2 11v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2"
              stroke="#1a1f2e"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {loading ? 'Generating...' : label}
        </button>
      )}
    </PDFDownloadLink>
  )
}
