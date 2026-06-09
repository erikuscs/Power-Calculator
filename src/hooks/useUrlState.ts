import { useSearchParams } from 'react-router-dom'
import { useCallback } from 'react'

export function useUrlState(key: string, defaultValue: string): [string, (value: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const value = searchParams.get(key) ?? defaultValue

  const setValue = useCallback((newValue: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (newValue === defaultValue) {
        next.delete(key)
      } else {
        next.set(key, newValue)
      }
      return next
    }, { replace: true })
  }, [key, defaultValue, setSearchParams])

  return [value, setValue]
}
