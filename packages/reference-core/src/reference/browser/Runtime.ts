// Browser data runtime: a tasty runtime and a symbol name in, loaded `ReferenceDocument` state out.
// Every display projection the load runs is read per call, and each one the step budget cut short
// adds a TST-W-PROJECTION-BUDGET warning to the document's warnings. The
// default runtime lazily imports the `__REFERENCE_UI_TYPES_RUNTIME__`
// placeholder, which the reference-types leg rewrites to `./tasty/runtime.js`
// so app bundlers see the real edge for the lazy chunk graph.

import * as React from 'react'
import type {
  RawTastyDiagnostic,
  RawTastyMember,
  RawTastyTypeRef,
  RawTastyTypeReference,
  TastyApi,
  TastyBrowserRuntime,
  TastyMember,
  TastySymbol,
} from '@reference-ui/rust/tasty'
import { createTastyBrowserRuntime } from '@reference-ui/rust/tasty/browser'
import { createReferenceDocument } from '../browser-model/index.ts'
import {
  getReferenceUiTastyBrowserApiOptions,
  projectionBudgetWarning,
  readReferenceDisplayResult,
} from '../tasty/api.ts'
import type { ReferenceDocument } from './types.ts'

export interface ReferenceRuntime {
  load(name: string): Promise<ReferenceRuntimeData>
}

export interface ReferenceRuntimeData {
  symbol: TastySymbol
  members: TastyMember[]
  extendsChain: TastySymbol[]
  memberOrigins: Map<string, TastySymbol>
  relatedSymbols: TastySymbol[]
  warnings: RawTastyDiagnostic[]
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
  const cutProjections = new Set<string>()
  const projection = await readReferenceDisplayResult(api, symbol)
  const hideProjection = shouldHideAliasProjection(symbol)
  const members = hideProjection ? [] : projection.members
  if (projection.truncated) cutProjections.add(symbol.getName())
  const extendsChain = symbol.getKind() === 'interface' ? await api.graph.loadExtendsChain(symbol) : []
  const memberOrigins = await loadReferenceMemberOrigins(api, symbol, extendsChain, cutProjections)
  const relatedSymbols = await loadReferenceRelatedSymbols(api, symbol)

  return {
    symbol,
    members,
    extendsChain,
    memberOrigins,
    relatedSymbols,
    // Member origins only label the members shown, so a cut walk reaches the document only when members are shown.
    warnings: hideProjection
      ? api.getWarnings()
      : [...api.getWarnings(), ...projectionWarnings(cutProjections)],
  }
}

/** One budget warning per symbol whose projection the step budget cut short, in the order the walks cut them. */
function projectionWarnings(cutProjections: Set<string>): RawTastyDiagnostic[] {
  return [...cutProjections].map(symbolName => projectionBudgetWarning(symbolName))
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

/** The map one origin walk fills, and the names of the source projections whose budget ran out. */
interface OriginWalk {
  origins: Map<string, TastySymbol>
  cutProjections: Set<string>
}

/** A source's display members; a projection the budget cut short is recorded under the source's name. */
async function readDisplayMembers(
  api: TastyApi,
  symbol: TastySymbol,
  cutProjections: Set<string>,
): Promise<TastyMember[]> {
  const projection = await readReferenceDisplayResult(api, symbol)
  if (projection.truncated) cutProjections.add(symbol.getName())
  return projection.members
}

async function getInheritedMemberSourceMembers(
  api: TastyApi,
  symbol: TastySymbol,
  cutProjections: Set<string>,
): Promise<TastyMember[]> {
  if (symbol.getKind() === 'typeAlias') {
    return readDisplayMembers(api, symbol, cutProjections)
  }

  return symbol.getMembers()
}

async function loadReferenceMemberOrigins(
  api: TastyApi,
  rootSymbol: TastySymbol,
  extendsChain: TastySymbol[],
  cutProjections: Set<string>,
): Promise<Map<string, TastySymbol>> {
  if (rootSymbol.getKind() === 'typeAlias') {
    return loadReferenceTypeAliasMemberOrigins(api, rootSymbol, cutProjections)
  }

  const origins = new Map<string, TastySymbol>()

  for (const currentSymbol of [...extendsChain, rootSymbol]) {
    const currentMembers = currentSymbol.getId() === rootSymbol.getId()
      ? currentSymbol.getMembers()
      : await getInheritedMemberSourceMembers(api, currentSymbol, cutProjections)

    for (const member of currentMembers) {
      origins.set(member.getId(), currentSymbol)
    }
  }

  return origins
}

async function loadReferenceTypeAliasMemberOrigins(
  api: TastyApi,
  rootSymbol: TastySymbol,
  cutProjections: Set<string>,
): Promise<Map<string, TastySymbol>> {
  const walk: OriginWalk = { origins: new Map<string, TastySymbol>(), cutProjections }
  await collectReferenceTypeAliasMemberOrigins(
    api,
    rootSymbol,
    rootSymbol.getUnderlyingType()?.getRaw(),
    walk,
  )
  return walk.origins
}

async function collectReferenceTypeAliasMemberOrigins(
  api: TastyApi,
  rootSymbol: TastySymbol,
  raw: RawTastyTypeRef | undefined,
  walk: OriginWalk,
): Promise<void> {
  if (!raw) return

  if (isRawTastyIntersection(raw)) {
    await Promise.all(
      raw.types.map(part =>
        collectReferenceTypeAliasMemberOrigins(api, rootSymbol, part, walk)
      )
    )
    return
  }

  if (isRawTastyTypeReference(raw)) {
    const sourceSymbol = await resolveReferenceTypeSourceSymbol(api, raw)
    if (!sourceSymbol || sourceSymbol.getId() === rootSymbol.getId()) return
    await setReferenceProjectedMemberOrigins(api, sourceSymbol, sourceSymbol, walk)
    return
  }

  if (raw.kind === 'object') {
    for (const member of raw.members) {
      walk.origins.set(getRawTastyMemberId(member), rootSymbol)
    }
  }
}

async function setReferenceProjectedMemberOrigins(
  api: TastyApi,
  sourceSymbol: TastySymbol,
  originSymbol: TastySymbol,
  walk: OriginWalk,
): Promise<void> {
  for (const member of await readDisplayMembers(api, sourceSymbol, walk.cutProjections)) {
    walk.origins.set(member.getId(), originSymbol)
  }
}

async function resolveReferenceTypeSourceSymbol(
  api: TastyApi,
  reference: RawTastyTypeReference,
): Promise<TastySymbol | undefined> {
  if (api.hasManifestSymbol(reference.id)) {
    return api.loadSymbolById(reference.id)
  }

  try {
    const scoped = await api.findSymbolByScopedName(reference.library, reference.name)
    if (scoped) return scoped
  } catch {
    // The emitted library can point at a re-exporting module; try a unique bare match.
  }

  const matches = await api.findSymbolsByName(reference.name)
  if (matches.length === 1) return api.loadSymbolById(matches[0]!.id)
  return undefined
}

function isRawTastyIntersection(
  raw: RawTastyTypeRef,
): raw is Extract<RawTastyTypeRef, { kind: 'intersection' }> {
  return 'kind' in raw && raw.kind === 'intersection'
}

function isRawTastyTypeReference(raw: RawTastyTypeRef): raw is RawTastyTypeReference {
  return 'id' in raw && 'name' in raw && 'library' in raw
}

function getRawTastyMemberId(member: RawTastyMember): string {
  return `${member.kind}:${member.name}`
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
    apiOptions: getReferenceUiTastyBrowserApiOptions(),
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
