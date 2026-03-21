import * as React from 'react'
import type { TastyApi, TastyBrowserRuntime, TastyMember, TastySymbol } from '@reference-ui/rust/tasty'
import { createTastyBrowserRuntime } from '@reference-ui/rust/tasty/browser'
import { createReferenceDocument } from './model'
import type { ReferenceDocument } from './types'

export interface ReferenceRuntime {
  load(name: string): Promise<ReferenceRuntimeData>
}

export interface ReferenceRuntimeData {
  symbol: TastySymbol
  members: TastyMember[]
  warnings: string[]
}

export interface ReferenceDocumentState {
  document: ReferenceDocument | null
  errorMessage: string | null
  isLoading: boolean
}

function getReferenceApi(runtime: TastyBrowserRuntime): Promise<TastyApi> {
  return runtime.loadApi()
}

async function loadReferenceRuntimeData(
  runtime: TastyBrowserRuntime,
  name: string,
): Promise<ReferenceRuntimeData> {
  const api = await getReferenceApi(runtime)
  const symbol = await api.loadSymbolByName(name)
  const members = symbol.getKind() === 'interface' ? await api.graph.getEffectiveMembers(symbol) : []

  return {
    symbol,
    members,
    warnings: api.getWarnings(),
  }
}

export function createReferenceRuntime(runtime: TastyBrowserRuntime): ReferenceRuntime {
  async function load(name: string): Promise<ReferenceRuntimeData> {
    return loadReferenceRuntimeData(runtime, name)
  }

  return {
    load,
  }
}

export function createDefaultReferenceRuntime(): ReferenceRuntime {
  const tastyBrowserRuntime = createTastyBrowserRuntime({
    loadRuntimeModule: () => import('__REFERENCE_UI_TYPES_RUNTIME__' as string),
  })

  return createReferenceRuntime(tastyBrowserRuntime)
}

export function useReferenceDocument(
  runtime: ReferenceRuntime,
  name: string,
): ReferenceDocumentState {
  const [document, setDocument] = React.useState<ReferenceDocument | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let active = true

    setIsLoading(true)
    setErrorMessage(null)
    setDocument(null)

    void runtime
      .load(name)
      .then((data) => {
        if (!active) return
        setDocument(createReferenceDocument(data.symbol, data.members, data.warnings))
        setIsLoading(false)
      })
      .catch((error: unknown) => {
        if (!active) return
        setErrorMessage(error instanceof Error ? error.message : String(error))
        setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [name, runtime])

  return {
    document,
    errorMessage,
    isLoading,
  }
}
