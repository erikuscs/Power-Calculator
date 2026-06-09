import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Clock, X, Trash2 } from 'lucide-react'
import type { HistoryEntry } from '../../hooks/useCalculationHistory'
import { Button } from './Button'

interface HistoryDrawerProps<T> {
  entries: HistoryEntry<T>[]
  onRestore: (inputs: T) => void
  onClear: () => void
}

export function HistoryDrawer<T>({ entries, onRestore, onClear }: HistoryDrawerProps<T>) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Calculation history"
        title="Calculation history"
      >
        <Clock size={16} />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* drawer panel */}
          <div className="relative w-80 max-w-full bg-sg-800 border-l border-sg-600 shadow-xl flex flex-col animate-slide-in-right">
            {/* header */}
            <div className="flex items-center justify-between p-4 border-b border-sg-600">
              <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                <Clock size={16} />
                Calculation History
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-text-muted hover:text-text transition-colors"
                aria-label="Close history"
              >
                <X size={18} />
              </button>
            </div>

            {/* entries */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {entries.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-8">
                  No calculations yet. Results will appear here automatically.
                </p>
              ) : (
                entries.map(entry => (
                  <button
                    key={entry.id}
                    onClick={() => {
                      onRestore(entry.inputs)
                      setOpen(false)
                    }}
                    className="w-full text-left p-3 rounded-lg bg-sg-700 hover:bg-sg-600 border border-sg-600 hover:border-sg-500 transition-colors"
                  >
                    <div className="text-xs text-text-muted mb-1">
                      {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                    </div>
                    <div className="text-sm text-text leading-snug">
                      {entry.label}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* footer */}
            {entries.length > 0 && (
              <div className="p-3 border-t border-sg-600">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-warning hover:text-warning"
                  onClick={() => {
                    onClear()
                  }}
                >
                  <Trash2 size={14} />
                  Clear History
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
