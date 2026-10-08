// Runtime provider: it takes a `ReferenceRuntime` plus children and emits a
// context supplying documents-by-name to UI outside the generated types
// bundle. Lib shells (Book, Cosmos) wrap their trees in this provider and
// read documents through the context hook instead of owning a runtime.

import * as React from 'react'
import type { ReferenceRuntime } from './Runtime.ts'
import { useReferenceDocument } from './Runtime.ts'

const ReferenceRuntimeContext = React.createContext<ReferenceRuntime | null>(null)

/**
 * Supplies a {@link ReferenceRuntime} for {@link useReferenceDocumentFromContext} and
 * for UI that lives outside the generated types bundle (e.g. Book/Cosmos in reference-lib).
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
