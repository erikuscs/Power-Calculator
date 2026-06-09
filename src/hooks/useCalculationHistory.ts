import { useLocalStorage } from './useLocalStorage'
import { useCallback } from 'react'

export interface HistoryEntry<T> {
  id: string
  timestamp: number
  inputs: T
  label: string
}

export function useCalculationHistory<T>(routeKey: string, maxEntries = 20) {
  const [entries, setEntries] = useLocalStorage<HistoryEntry<T>[]>(
    `power-calc:history:${routeKey}`,
    [],
  )

  const addEntry = useCallback(
    (inputs: T, label: string) => {
      const entry: HistoryEntry<T> = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        inputs,
        label,
      }
      setEntries(prev => [entry, ...prev].slice(0, maxEntries))
    },
    [setEntries, maxEntries],
  )

  const restoreEntry = useCallback(
    (id: string): T | undefined => {
      const entry = entries.find(e => e.id === id)
      return entry?.inputs
    },
    [entries],
  )

  const clearHistory = useCallback(() => {
    setEntries([])
  }, [setEntries])

  return { entries, addEntry, restoreEntry, clearHistory }
}
