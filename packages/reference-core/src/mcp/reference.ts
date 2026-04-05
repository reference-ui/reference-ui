import type { TastyApi, TastyMember, TastySymbol } from '@reference-ui/rust/tasty'
import { getTastyResolvedType } from '@reference-ui/rust/tasty'
import { createReferenceDocument } from '../reference/browser-model'
import { createReferenceUiTastyApi } from '../reference/tasty/api'
import type { ReferenceDocument } from '../reference/browser/types'

export interface McpReferenceMemberData {
  name: string
  type: string | null
  description: string | null
  optional: boolean
  readonly: boolean
  defaultValue?: string
}

export interface McpReferenceData {
  members: McpReferenceMemberData[]
  warnings: string[]
}

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
        ? await current.getMembers()
        : await getInheritedSourceMembers(current)

    for (const member of members) {
      origins.set(member.getId(), current)
    }
  }

  return origins
}

export function createReferenceApi(manifestPath: string): TastyApi {
  return createReferenceUiTastyApi({ manifestPath })
}

function toMcpReferenceMemberData(member: TastyMember): McpReferenceMemberData {
  const type = member.getType()
  const resolvedType = type ? (getTastyResolvedType(type) ?? type) : undefined

  return {
    name: member.getName(),
    type: resolvedType?.describe() ?? null,
    description: member.getDescription() ?? null,
    optional: member.isOptional(),
    readonly: member.isReadonly(),
    defaultValue: member.getDefaultValue(),
  }
}

function getScopedLibrary(source?: string): string | null {
  if (!source) return null
  if (source.startsWith('.')) return 'user'
  if (source.startsWith('@')) return source
  return null
}

async function loadReferenceSymbol(
  api: TastyApi,
  name: string,
  source?: string
): Promise<TastySymbol> {
  const library = getScopedLibrary(source)

  if (library) {
    try {
      return await api.loadSymbolByScopedName(library, name)
    } catch {
      // Fall back to bare-name lookup for manifests that do not carry the expected library key.
    }
  }

  return api.loadSymbolByName(name)
}

export async function loadReferenceDocument(
  api: TastyApi,
  name: string,
  source?: string
): Promise<ReferenceDocument | null> {
  let symbol: TastySymbol

  try {
    symbol = await loadReferenceSymbol(api, name, source)
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

export async function loadMcpReferenceData(
  api: TastyApi,
  name: string,
  source?: string
): Promise<McpReferenceData | null> {
  let symbol: TastySymbol

  try {
    symbol = await loadReferenceSymbol(api, name, source)
  } catch {
    return null
  }

  const projectedMembers = await api.graph.getDisplayMembers(symbol)
  const members = shouldHideAliasProjection(symbol) ? [] : projectedMembers

  return {
    members: members.map(toMcpReferenceMemberData),
    warnings: api.getWarnings(),
  }
}
