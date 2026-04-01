import { useState, useEffect, useCallback, useRef } from 'react'

export function useLooplyData<T>(
  fetcher: () => Promise<T>,
  options?: { debounceMs?: number }
): { data: T | null; loading: boolean; refresh: () => Promise<void> } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debounceMs = options?.debounceMs ?? 500

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      console.error('Failed to fetch Looply data:', err)
    }
    setLoading(false)
  }, [fetcher])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!window.api?.onStateChanged) return
    const cleanup = window.api.onStateChanged(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        refresh()
      }, debounceMs)
    })
    return () => {
      cleanup()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [refresh, debounceMs])

  return { data, loading, refresh }
}
