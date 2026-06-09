import { useState } from 'react'

const STORAGE_KEY = 'power-calc-disclaimer-accepted'

export function DisclaimerModal() {
  const [accepted, setAccepted] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true',
  )

  if (accepted) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-sg-800 border border-sg-600 rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-lg font-semibold text-text mb-3">
          Important Notice
        </h2>
        <p className="text-sm text-text-muted leading-relaxed mb-6">
          This application provides estimates for reference and planning
          purposes only. All calculations must be verified by a licensed
          professional engineer before making equipment sizing, procurement, or
          design decisions. Sustainable Gaps assumes no liability for decisions
          made based on these calculations.
        </p>
        <button
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, 'true')
            setAccepted(true)
          }}
          className="w-full py-2.5 rounded-lg bg-accent-500 text-sg-900 font-semibold text-sm hover:bg-accent-400 transition-colors cursor-pointer"
        >
          I Understand
        </button>
      </div>
    </div>
  )
}
