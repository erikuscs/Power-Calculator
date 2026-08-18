import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { Download, Printer, Share2 } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export interface PdfActionBarProps {
  document: ReactElement<DocumentProps>
  filename: string
  title: string
  shareText: string
}

type PdfAction = 'print' | 'save' | 'share'

const actionClasses =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70 disabled:cursor-wait disabled:opacity-60'

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
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 15_000)
}

function printBlob(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const printWindow = window.open(url, '_blank')
  if (!printWindow) {
    URL.revokeObjectURL(url)
    throw new Error('The print-ready PDF was blocked by the browser. Allow pop-ups and try again.')
  }

  printWindow.opener = null

  const requestPrint = () => {
    try {
      printWindow.focus()
      printWindow.print()
    } catch {
      // Some built-in PDF viewers own the new tab. The file still opens print-ready.
    }
  }

  printWindow.addEventListener('load', requestPrint, { once: true })
  window.setTimeout(requestPrint, 900)
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

async function writeNativePdf(blob: Blob, filename: string) {
  const data = await blobToBase64(blob)
  return Filesystem.writeFile({
    path: filename,
    data,
    directory: Directory.Cache,
  })
}

function isShareCancel(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') return true
  return (error as Error)?.message?.toLowerCase().includes('cancel') ?? false
}

export function PdfActionBar({ document: pdfDocument, filename, title, shareText }: PdfActionBarProps) {
  const [busyAction, setBusyAction] = useState<PdfAction | null>(null)
  const [status, setStatus] = useState('')

  const runAction = async (action: PdfAction) => {
    setBusyAction(action)
    setStatus('Preparing the review package...')

    try {
      const blob = await pdf(pdfDocument).toBlob()

      if (Capacitor.isNativePlatform()) {
        const file = await writeNativePdf(blob, filename)
        const nativePrompt = action === 'print'
          ? 'Choose Print in the share sheet.'
          : action === 'save'
            ? 'Choose Save to Files in the share sheet.'
            : 'Choose Messages, AirDrop, Mail, or another destination.'

        setStatus(nativePrompt)
        await Share.share({
          title,
          text: shareText,
          url: file.uri,
          files: [file.uri],
          dialogTitle: action === 'share' ? 'Share EMaaS PDF' : 'Open EMaaS PDF',
        })
        setStatus(action === 'share' ? 'Review package shared.' : 'Review package opened in the share sheet.')
        return
      }

      if (action === 'print') {
        printBlob(blob)
        setStatus('Print-ready PDF opened in a new tab.')
        return
      }

      if (action === 'save') {
        downloadBlob(blob, filename)
        setStatus('Review package saved.')
        return
      }

      const file = new File([blob], filename, { type: 'application/pdf' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, text: shareText })
        setStatus('Review package shared.')
      } else {
        downloadBlob(blob, filename)
        setStatus('File sharing is not available in this browser, so the PDF was saved instead.')
      }
    } catch (error) {
      if (isShareCancel(error)) {
        setStatus('Share canceled.')
      } else {
        console.error('PDF action failed', error)
        setStatus((error as Error)?.message || 'The PDF could not be prepared. Please try again.')
      }
    } finally {
      setBusyAction(null)
    }
  }

  const buttonLabel = (action: PdfAction, label: string) => busyAction === action ? 'Preparing...' : label

  return (
    <div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" aria-label="Review package actions">
        <button
          type="button"
          className={`${actionClasses} border-sg-500/80 bg-sg-900/80 text-text hover:border-accent-500/60 hover:bg-sg-700`}
          disabled={busyAction !== null}
          onClick={() => runAction('print')}
        >
          <Printer size={16} />
          {buttonLabel('print', 'Print')}
        </button>
        <button
          type="button"
          className={`${actionClasses} border-accent-500/55 bg-accent-500 text-sg-900 hover:bg-accent-400`}
          disabled={busyAction !== null}
          onClick={() => runAction('save')}
        >
          <Download size={16} />
          {buttonLabel('save', 'Save PDF')}
        </button>
        <button
          type="button"
          className={`${actionClasses} border-signal-blue/45 bg-signal-blue/10 text-signal-blue hover:bg-signal-blue/15`}
          disabled={busyAction !== null}
          onClick={() => runAction('share')}
        >
          <Share2 size={16} />
          {buttonLabel('share', 'Share PDF')}
        </button>
      </div>
      <p className="mt-2 min-h-4 text-[11px] leading-relaxed text-text-dim" aria-live="polite">
        {status || 'Share PDF opens Messages, AirDrop, Mail, and other available destinations.'}
      </p>
    </div>
  )
}
