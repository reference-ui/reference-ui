import type { RawTastySymbol, RawTastySymbolRef, TastyMember, TastySymbol, TastySymbolRef } from '@reference-ui/rust/tasty'
import type { ReferenceDocument, ReferenceSymbolRef } from '../types'
import { createReferenceMemberDocument } from './member'
import { createReferenceJsDoc, createReferenceType, createReferenceTypeParameter, formatReferenceType } from './type'

export function createReferenceDocument(
  symbol: TastySymbol,
  members: TastyMember[],
  relatedSymbols: TastySymbol[] = [],
  warnings: string[] = [],
): ReferenceDocument {
  const typeParameterDetails = symbol.getTypeParameters().map(createReferenceTypeParameter)
  const extendsRefs = symbol.getExtends().map(createReferenceSymbolRef)
  const relatedTypes = getReferenceRelatedTypes(symbol.getRaw())
  const definitionType = createReferenceType(symbol.getUnderlyingType()) ?? null
  const symbolLookup = new Map<string, TastySymbol>([
    [symbol.getId(), symbol],
    ...relatedSymbols.map((relatedSymbol) => [relatedSymbol.getId(), relatedSymbol] as const),
  ])

  return {
    id: symbol.getId(),
    name: symbol.getName(),
    kind: symbol.getKind(),
    kindLabel: symbol.getKind() === 'typeAlias' ? 'Type alias' : 'Interface',
    library: symbol.getLibrary(),
    warnings,
    description: symbol.getDescription(),
    jsDoc: createReferenceJsDoc(symbol.getRaw()),
    typeParameters: typeParameterDetails.map((param) => param.name),
    typeParameterDetails,
    extendsNames: extendsRefs.map((ref) => ref.name),
    extends: extendsRefs,
    types: relatedTypes,
    definition: definitionType ? formatReferenceType(definitionType) : symbol.getUnderlyingType()?.describe() ?? null,
    definitionType,
    members: members.map((member) => createReferenceMemberDocument(member, symbolLookup)),
  }
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
    library: ref.library,
  }
}

function getReferenceRelatedTypes(raw: RawTastySymbol): ReferenceSymbolRef[] {
  if (!('types' in raw)) return []
  return raw.types.map(createReferenceSymbolRef)
}

function isTastySymbolRef(ref: TastySymbolRef | RawTastySymbolRef): ref is TastySymbolRef {
  return typeof ref === 'object' && ref != null && 'getId' in ref
}
