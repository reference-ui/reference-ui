import type { TastyApi, TastyMember, TastySymbol } from '@reference-ui/rust/tasty'
import { createTastyApi } from '@reference-ui/rust/tasty'
import { createReferenceDocument } from '../reference/browser/model'
import type { ReferenceDocument } from '../reference/browser/types'

function shouldHideAliasProjection(symbol: TastySymbol): boolean {
  if (symbol.getKind() !== 'typeAlias') return false
  return symbol.getUnderlyingType()?.isReference() ?? false
}

async function loadRelatedSymbols(
  api: TastyApi,
  rootSymbol: TastySymbol
): Promise<TastySymbol[]> {
  const visited = new Set<string>([rootSymbol.getId()])
  const queue: TastySymbol[] = [rootSymbol]
  const relatedSymbols: TastySymbol[] = []

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue

    const refs = await api.graph.collectUserOwnedReferences(current)
    for (const ref of refs) {
      const id = ref.getId()
      if (visited.has(id)) continue
      visited.add(id)

      try {
        const loaded = await ref.load()
        relatedSymbols.push(loaded)
        queue.push(loaded)
      } catch {
        // Some references are not backed by manifest-owned symbols.
      }
    }
  }

  return relatedSymbols
}

async function getInheritedSourceMembers(symbol: TastySymbol): Promise<TastyMember[]> {
  if (symbol.getKind() === 'typeAlias') {
    return symbol.getDisplayMembers()
  }

  return symbol.getMembers()
}

async function loadMemberOrigins(
  rootSymbol: TastySymbol,
  extendsChain: TastySymbol[]
): Promise<Map<string, TastySymbol>> {
  const origins = new Map<string, TastySymbol>()

  for (const current of [...extendsChain, rootSymbol]) {
    const members =
      current.getId() === rootSymbol.getId()
        ? current.getMembers()
        : await getInheritedSourceMembers(current)

    for (const member of members) {
      origins.set(member.getId(), current)
    }
  }

  return origins
}

export function createReferenceApi(manifestPath: string): TastyApi {
  return createTastyApi({ manifestPath })
}

export async function loadReferenceDocument(
  api: TastyApi,
  name: string
): Promise<ReferenceDocument | null> {
  let symbol: TastySymbol

  try {
    symbol = await api.loadSymbolByName(name)
  } catch {
    return null
  }

  const projectedMembers = await api.graph.getDisplayMembers(symbol)
  const members = shouldHideAliasProjection(symbol) ? [] : projectedMembers
  const extendsChain =
    symbol.getKind() === 'interface' ? await api.graph.loadExtendsChain(symbol) : []
  const memberOrigins =
    symbol.getKind() === 'interface'
      ? await loadMemberOrigins(symbol, extendsChain)
      : new Map<string, TastySymbol>()
  const relatedSymbols = await loadRelatedSymbols(api, symbol)
  const warnings = api.getWarnings()

  return createReferenceDocument(symbol, members, {
    extendsChain,
    memberOrigins,
    relatedSymbols,
    warnings,
  })
}
