import * as React from 'react'
import type { ReferenceRuntime } from './Runtime'
import { useReferenceDocument } from './Runtime'

const ReferenceRuntimeContext = React.createContext<ReferenceRuntime | null>(null)

/**
 * Supplies a {@link ReferenceRuntime} for {@link useReferenceDocumentFromContext} and
 * for UI that lives outside `@reference-ui/core` (e.g. Cosmos in reference-lib).
 */
export function ReferenceRuntimeProvider({
  runtime,
  children,
}: {
  runtime: ReferenceRuntime
  children: React.ReactNode
}) {
  return <ReferenceRuntimeContext.Provider value={runtime}>{children}</ReferenceRuntimeContext.Provider>
}

export function useReferenceRuntime(): ReferenceRuntime {
  const runtime = React.useContext(ReferenceRuntimeContext)
  if (runtime == null) {
    throw new Error('ReferenceRuntimeProvider is required')
  }
  return runtime
}

export function useReferenceDocumentFromContext(name: string) {
  const runtime = useReferenceRuntime()
  return useReferenceDocument(runtime, name)
}
