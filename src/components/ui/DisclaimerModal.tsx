import { useState } from 'react'

const STORAGE_KEY = 'power-calc-disclaimer-accepted'

export function DisclaimerModal() {
  const [accepted, setAccepted] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true',
  )

  if (accepted) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-sg-800 border border-sg-600/40 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
        <p className="text-[10px] font-bold text-accent-500 uppercase tracking-[0.15em] mb-3">Important Notice</p>
        <h2 className="text-xl font-bold text-text mb-4 tracking-tight leading-tight">
          This tool provides estimates,<br />not engineering designs.
        </h2>
        <p className="text-sm text-text-muted leading-relaxed mb-8">
          All calculations must be verified by a licensed professional engineer
          before making equipment sizing, procurement, or design decisions.
          Sustainable Gaps assumes no liability for decisions made based on
          these calculations.
        </p>
        <button
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, 'true')
            setAccepted(true)
          }}
          className="w-full py-3 rounded-lg bg-accent-500 text-sg-900 font-bold text-sm hover:bg-accent-400 transition-colors cursor-pointer tracking-wide"
        >
          I Understand
        </button>
      </div>
    </div>
  )
}
