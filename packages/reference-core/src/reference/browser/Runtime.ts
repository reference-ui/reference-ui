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
  extendsChain: TastySymbol[]
  memberOrigins: Map<string, TastySymbol>
  relatedSymbols: TastySymbol[]
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
  const projectedMembers = await api.graph.getDisplayMembers(symbol)
  const members = shouldHideAliasProjection(symbol) ? [] : projectedMembers
  const extendsChain = symbol.getKind() === 'interface' ? await api.graph.loadExtendsChain(symbol) : []
  const memberOrigins = symbol.getKind() === 'interface'
    ? await loadReferenceMemberOrigins(symbol, extendsChain)
    : new Map<string, TastySymbol>()
  const relatedSymbols = await loadReferenceRelatedSymbols(api, symbol)

  return {
    symbol,
    members,
    extendsChain,
    memberOrigins,
    relatedSymbols,
    warnings: api.getWarnings(),
  }
}

function shouldHideAliasProjection(symbol: TastySymbol): boolean {
  if (symbol.getKind() !== 'typeAlias') return false
  return symbol.getUnderlyingType()?.isReference() ?? false
}

async function loadReferenceRelatedSymbols(api: TastyApi, rootSymbol: TastySymbol): Promise<TastySymbol[]> {
  const visited = new Set<string>([rootSymbol.getId()])
  const queue: TastySymbol[] = [rootSymbol]
  const relatedSymbols: TastySymbol[] = []

  while (queue.length > 0) {
    const currentSymbol = queue.shift()
    if (!currentSymbol) continue

    const dependencyRefs = await api.graph.collectUserOwnedReferences(currentSymbol)
    for (const dependencyRef of dependencyRefs) {
      const dependencyId = dependencyRef.getId()
      if (visited.has(dependencyId)) continue

      visited.add(dependencyId)

      try {
        const dependency = await dependencyRef.load()
        relatedSymbols.push(dependency)
        queue.push(dependency)
      } catch {
        // Some raw references are not manifest-backed symbols (for example mapped type params).
      }
    }
  }

  return relatedSymbols
}

async function getInheritedMemberSourceMembers(symbol: TastySymbol): Promise<TastyMember[]> {
  if (symbol.getKind() === 'typeAlias') {
    return symbol.getDisplayMembers()
  }

  return symbol.getMembers()
}

async function loadReferenceMemberOrigins(
  rootSymbol: TastySymbol,
  extendsChain: TastySymbol[],
): Promise<Map<string, TastySymbol>> {
  const origins = new Map<string, TastySymbol>()

  for (const currentSymbol of [...extendsChain, rootSymbol]) {
    const currentMembers = currentSymbol.getId() === rootSymbol.getId()
      ? currentSymbol.getMembers()
      : await getInheritedMemberSourceMembers(currentSymbol)

    for (const member of currentMembers) {
      origins.set(member.getId(), currentSymbol)
    }
  }

  return origins
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

    runtime
      .load(name)
      .then((data) => {
        if (!active) return
        setDocument(
          createReferenceDocument(
            data.symbol,
            data.members,
            {
              extendsChain: data.extendsChain,
              memberOrigins: data.memberOrigins,
              relatedSymbols: data.relatedSymbols,
              warnings: data.warnings,
            },
          ),
        )
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
