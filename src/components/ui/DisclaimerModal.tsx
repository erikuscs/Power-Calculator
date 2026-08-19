import { useEffect, useRef, useState } from 'react'
import { APP_BRAND } from '../../lib/brand'

const STORAGE_KEY = 'power-calc-disclaimer-accepted'

export function DisclaimerModal() {
  const continueButtonRef = useRef<HTMLButtonElement>(null)
  const [accepted, setAccepted] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true',
  )

  useEffect(() => {
    if (!accepted) continueButtonRef.current?.focus()
  }, [accepted])

  if (accepted) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="emaas-disclaimer-title"
        aria-describedby="emaas-disclaimer-description"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-sg-600/40 bg-sg-800 p-6 shadow-2xl sm:p-8"
      >
        <p className="text-[10px] font-bold text-accent-500 uppercase tracking-[0.15em] mb-3">{APP_BRAND.productName}</p>
        <h2 id="emaas-disclaimer-title" className="text-xl font-bold text-text mb-4 tracking-tight leading-tight">
          Energy Management as a Service planning,<br />{' '}not engineering design.
        </h2>
        <p id="emaas-disclaimer-description" className="text-sm text-text-muted leading-relaxed mb-8">
          {APP_BRAND.productName} provides operational estimates for BESS,
          generator, cooling, and hybrid energy planning. All outputs must be
          verified by a licensed professional engineer before making equipment
          sizing, procurement, or design decisions. {APP_BRAND.companyName}{' '}
          assumes no liability for decisions made from these calculations.
        </p>
        <button
          ref={continueButtonRef}
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, 'true')
            setAccepted(true)
          }}
          className="w-full py-3 rounded-lg bg-accent-500 text-sg-900 font-bold text-sm hover:bg-accent-400 transition-colors cursor-pointer tracking-wide"
        >
          Continue to {APP_BRAND.productName}
        </button>
      </div>
    </div>
  )
}
