import { useLocalStorage } from './useLocalStorage'

export function usePersistedState<T>(routeKey: string, field: string, initialValue: T) {
  return useLocalStorage<T>(`power-calc:${routeKey}:${field}`, initialValue)
}
