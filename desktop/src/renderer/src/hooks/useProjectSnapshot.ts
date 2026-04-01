import { useCallback } from 'react'
import { useLooplyData } from './useLooplyData'
import type { ProjectSnapshot } from '../../../preload/types'

export function useProjectSnapshot() {
  const fetcher = useCallback(() => window.api.getSnapshot() as Promise<ProjectSnapshot | null>, [])
  return useLooplyData(fetcher)
}
