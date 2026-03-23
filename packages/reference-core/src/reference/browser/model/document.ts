import { getTastyResolvedType } from '@reference-ui/rust/tasty'
import type { RawTastySymbol, RawTastySymbolRef, TastyMember, TastySymbol, TastySymbolRef } from '@reference-ui/rust/tasty'
import type { ReferenceDocument, ReferenceSymbolRef } from '../types'
import { createReferenceMemberDocument } from './member'
import { createReferenceJsDoc, createReferenceType, createReferenceTypeParameter, formatReferenceType } from './type'

interface CreateReferenceDocumentOptions {
  extendsChain?: TastySymbol[]
  relatedSymbols?: TastySymbol[]
  warnings?: string[]
}

export function createReferenceDocument(
  symbol: TastySymbol,
  members: TastyMember[],
  options: CreateReferenceDocumentOptions = {},
): ReferenceDocument {
  const {
    extendsChain = [],
    relatedSymbols = [],
    warnings = [],
  } = options
  const typeParameterDetails = symbol.getTypeParameters().map(createReferenceTypeParameter)
  const extendsRefs = symbol.getExtends().map(createReferenceSymbolRef)
  const relatedTypes = getReferenceRelatedTypes(symbol.getRaw())
  const underlyingType = symbol.getUnderlyingType()
  const definitionType = createReferenceType(getTastyResolvedType(underlyingType) ?? underlyingType) ?? null
  const definition = getReferenceDocumentDefinition(definitionType, underlyingType)
  const rootRef = createReferenceOwnedSymbolRef(symbol)
  const memberOrigins = createReferenceMemberOrigins(symbol, extendsChain)
  const symbolLookup = new Map<string, TastySymbol>([
    [symbol.getId(), symbol],
    ...relatedSymbols.map((relatedSymbol) => [relatedSymbol.getId(), relatedSymbol] as const),
  ])

  return {
    id: symbol.getId(),
    name: symbol.getName(),
    kind: symbol.getKind(),
    kindLabel: getReferenceDocumentKindLabel(symbol),
    library: symbol.getLibrary(),
    warnings,
    description: symbol.getDescription(),
    jsDoc: createReferenceJsDoc(symbol.getRaw()),
    typeParameters: typeParameterDetails.map((param) => param.name),
    typeParameterDetails,
    extendsNames: extendsRefs.map((ref) => ref.name),
    extends: extendsRefs,
    types: relatedTypes,
    definition,
    definitionType,
    members: members.map((member) =>
      createReferenceMemberDocument(member, symbolLookup, {
        declaredBy: memberOrigins.get(member.getId()) ?? rootRef,
        inheritedFrom: getReferenceMemberInheritedFrom(member, memberOrigins, symbol, rootRef),
      }),
    ),
  }
}

function getReferenceDocumentKindLabel(symbol: TastySymbol): ReferenceDocument['kindLabel'] {
  return symbol.getKind() === 'typeAlias' ? 'Type' : 'Interface'
}

function getReferenceDocumentDefinition(
  definitionType: ReferenceDocument['definitionType'],
  underlyingType: ReturnType<TastySymbol['getUnderlyingType']>,
): ReferenceDocument['definition'] {
  if (definitionType) return formatReferenceType(definitionType)
  return underlyingType?.describe() ?? null
}

function createReferenceMemberOrigins(
  rootSymbol: TastySymbol,
  extendsChain: TastySymbol[],
): Map<string, ReferenceSymbolRef> {
  const origins = new Map<string, ReferenceSymbolRef>()

  for (const currentSymbol of [...extendsChain, rootSymbol]) {
    const ownerRef = createReferenceOwnedSymbolRef(currentSymbol)

    for (const member of currentSymbol.getMembers()) {
      origins.set(member.getId(), ownerRef)
    }
  }

  return origins
}

function getReferenceMemberInheritedFrom(
  member: TastyMember,
  memberOrigins: Map<string, ReferenceSymbolRef>,
  rootSymbol: TastySymbol,
  rootRef: ReferenceSymbolRef,
): ReferenceSymbolRef | undefined {
  const declaredBy = memberOrigins.get(member.getId()) ?? rootRef
  if (declaredBy.id === rootSymbol.getId()) return undefined
  return declaredBy
}

function createReferenceOwnedSymbolRef(symbol: TastySymbol): ReferenceSymbolRef {
  const ref: ReferenceSymbolRef = {
    id: symbol.getId(),
    name: symbol.getName(),
    kind: symbol.getKind(),
  }
  const library = symbol.getLibrary()
  if (library) {
    ref.library = library
  }
  return ref
}

function createReferenceSymbolRef(ref: TastySymbolRef | RawTastySymbolRef): ReferenceSymbolRef {
  if (isTastySymbolRef(ref)) {
    return {
      id: ref.getId(),
      name: ref.getName(),
      kind: ref.getKind(),
      library: ref.getLibrary(),
    }
  }

  return {
    id: ref.id,
    name: ref.name,
    kind: 'kind' in ref && typeof ref.kind === 'string' ? ref.kind : undefined,
    library: typeof ref.library === 'string' ? ref.library : undefined,
  }
}

function getReferenceRelatedTypes(raw: RawTastySymbol): ReferenceSymbolRef[] {
  if (!('types' in raw)) return []
  return raw.types.map(createReferenceSymbolRef)
}

function isTastySymbolRef(ref: TastySymbolRef | RawTastySymbolRef): ref is TastySymbolRef {
  return typeof ref === 'object' && ref != null && 'getId' in ref
}
