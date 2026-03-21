import type { RawTastySymbol, RawTastySymbolRef, TastyMember, TastySymbol, TastySymbolRef } from '@reference-ui/rust/tasty'
import type { ReferenceDocument, ReferenceSymbolRef } from '../types'
import { createReferenceMemberDocument } from './member'
import { createReferenceJsDoc, createReferenceType, createReferenceTypeParameter } from './type'

export function createReferenceDocument(
  symbol: TastySymbol,
  members: TastyMember[],
  warnings: string[] = [],
): ReferenceDocument {
  const typeParameterDetails = symbol.getTypeParameters().map(createReferenceTypeParameter)
  const extendsRefs = symbol.getExtends().map(createReferenceSymbolRef)
  const relatedTypes = getReferenceRelatedTypes(symbol.getRaw())

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
    definition: symbol.getUnderlyingType()?.describe() ?? null,
    definitionType: createReferenceType(symbol.getUnderlyingType()) ?? null,
    members: members.map(createReferenceMemberDocument),
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
