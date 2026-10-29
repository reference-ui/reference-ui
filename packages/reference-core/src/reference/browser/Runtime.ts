// Browser data runtime: a tasty runtime and a symbol name in, loaded `ReferenceDocument` state out.
// Every display projection the load runs is read per call, and each walk-limit notice one of them raised
// becomes a TST-W-PROJECTION-BUDGET warning on the document. The
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
import {
  createReferenceDocument,
  loadUnionAliasMembers,
  resolveReferenceTypeSourceSymbol,
} from '../browser-model/index.ts'
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
  const cutNotices = new Set<string>()
  const projection = await readReferenceDisplayResult(api, symbol)
  const hideProjection = shouldHideAliasProjection(symbol)
  const unionMerge = hideProjection ? undefined : await loadUnionAliasMembers(api, symbol, cutNotices)
  const members = hideProjection ? [] : unionMerge?.members ?? projection.members
  for (const notice of projection.notices) cutNotices.add(notice)
  const extendsChain = symbol.getKind() === 'interface' ? await api.graph.loadExtendsChain(symbol) : []
  const memberOrigins = unionMerge?.origins ?? await loadReferenceMemberOrigins(api, symbol, extendsChain, cutNotices)
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
      : [...api.getWarnings(), ...projectionWarnings(cutNotices)],
  }
}

/** One TST-W-PROJECTION-BUDGET warning per walk-limit notice, in the order the walks raised them. */
function projectionWarnings(cutNotices: Set<string>): RawTastyDiagnostic[] {
  return [...cutNotices].map(notice => projectionBudgetWarning(notice))
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

/** The map one origin walk fills, and the walk-limit notices of the source projections it read. */
interface OriginWalk {
  origins: Map<string, TastySymbol>
  cutNotices: Set<string>
}

/** A source's display members; the walk-limit notices of its projection join the document's notices. */
async function readDisplayMembers(
  api: TastyApi,
  symbol: TastySymbol,
  cutNotices: Set<string>,
): Promise<TastyMember[]> {
  const projection = await readReferenceDisplayResult(api, symbol)
  for (const notice of projection.notices) cutNotices.add(notice)
  return projection.members
}

async function getInheritedMemberSourceMembers(
  api: TastyApi,
  symbol: TastySymbol,
  cutNotices: Set<string>,
): Promise<TastyMember[]> {
  if (symbol.getKind() === 'typeAlias') {
    return readDisplayMembers(api, symbol, cutNotices)
  }

  return symbol.getMembers()
}

async function loadReferenceMemberOrigins(
  api: TastyApi,
  rootSymbol: TastySymbol,
  extendsChain: TastySymbol[],
  cutNotices: Set<string>,
): Promise<Map<string, TastySymbol>> {
  if (rootSymbol.getKind() === 'typeAlias') {
    return loadReferenceTypeAliasMemberOrigins(api, rootSymbol, cutNotices)
  }

  const origins = new Map<string, TastySymbol>()

  for (const currentSymbol of [...extendsChain, rootSymbol]) {
    const currentMembers = currentSymbol.getId() === rootSymbol.getId()
      ? currentSymbol.getMembers()
      : await getInheritedMemberSourceMembers(api, currentSymbol, cutNotices)

    for (const member of currentMembers) {
      origins.set(member.getId(), currentSymbol)
    }
  }

  return origins
}

async function loadReferenceTypeAliasMemberOrigins(
  api: TastyApi,
  rootSymbol: TastySymbol,
  cutNotices: Set<string>,
): Promise<Map<string, TastySymbol>> {
  const walk: OriginWalk = { origins: new Map<string, TastySymbol>(), cutNotices }
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
  for (const member of await readDisplayMembers(api, sourceSymbol, walk.cutNotices)) {
    walk.origins.set(member.getId(), originSymbol)
  }
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
