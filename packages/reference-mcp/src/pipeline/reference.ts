// Tasty manifest loading for resolved component types.
// It takes a manifest path and emits the loaded reference document plus per-component
// data, formatting manifest diagnostics through the shared warning one-liner. Each component's
// own display projection is read per call, so its `truncated` mark says whether the step budget
// cut that walk, whatever other components were projecting on the same shared api at the time.
import type { TastyApi, TastyMember, TastySymbol } from '@reference-ui/rust/tasty'
import { getTastyResolvedType } from '@reference-ui/rust/tasty'
import {
  createReferenceDocument,
  createReferenceUiTastyApi,
  type ReferenceDocument,
} from '@reference-ui/core/reference'
import { formatReferenceWarning } from './warnings'

export interface McpReferenceMemberData {
  name: string
  type: string | null
  description: string | null
  optional: boolean
  readonly: boolean
  defaultValue?: string
}

export interface McpReferenceData {
  description?: string | null
  members: McpReferenceMemberData[]
  warnings: string[]
  /** Set only when the step budget cut the component's member projection short, so its members are partial. */
  truncated?: boolean
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
  source?: string,
  componentName?: string
): Promise<McpReferenceData | null> {
  let symbol: TastySymbol

  try {
    symbol = await loadReferenceSymbol(api, name, source)
  } catch {
    return null
  }

  const projection = await api.graph.getDisplayResult(symbol)
  const hideProjection = shouldHideAliasProjection(symbol)
  const members = hideProjection ? [] : projection.members
  // A hidden alias contributes no members, so a cut walk over it leaves the component's data complete.
  const truncated = !hideProjection && projection.truncated

  let description = symbol.getDescription() ?? null
  if (!description && componentName && componentName !== name) {
    try {
      const compSymbol = await loadReferenceSymbol(api, componentName, source)
      description = compSymbol.getDescription() ?? null
    } catch {
      // Fallback symbol lookup failed
    }
  }

  return {
    description,
    members: members.map(toMcpReferenceMemberData),
    warnings: api.getWarnings().map(formatReferenceWarning),
    ...(truncated ? { truncated: true } : {}),
  }
}
