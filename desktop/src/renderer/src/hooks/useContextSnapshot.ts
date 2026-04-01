import { useCallback } from 'react'
import { useLooplyData } from './useLooplyData'
import type { ContextSnapshot } from '../../../preload/types'

export function useContextSnapshot() {
  const fetcher = useCallback(() => window.api.getContext() as Promise<ContextSnapshot | null>, [])
  return useLooplyData(fetcher)
}
