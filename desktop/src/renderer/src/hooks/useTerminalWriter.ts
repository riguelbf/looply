import { createContext, useContext } from 'react'

export interface TerminalWriterAPI {
  writeCommand: (command: string) => void
  activeFeature: string | null
  setActiveFeature: (feature: string | null) => void
}

export const TerminalWriterContext = createContext<TerminalWriterAPI>({
  writeCommand: () => {},
  activeFeature: null,
  setActiveFeature: () => {}
})

export function useTerminalWriter(): TerminalWriterAPI {
  return useContext(TerminalWriterContext)
}
