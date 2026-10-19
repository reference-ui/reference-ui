/**
 * Dependency collection over a symbol's declared references.
 * Collects the symbol references a declaration depends on, so the resolver knows which symbols
 * to load. It walks heritage clauses, members, type parameters and every structured type node.
 * A type parameter or infer name is bound by its declaration, so it never counts as a dependency.
 */
import type {
  RawTastyFnParam,
  RawTastyInterfaceSymbol,
  RawTastyMember,
  RawTastyStructuredTypeRef,
  RawTastySymbolRef,
  RawTastyTemplateLiteralPart,
  RawTastyTupleElement,
  RawTastyTypeParameter,
  RawTastyTypeRef,
  RawTastyTypeReference,
} from '../api-types.js'
import { isInterfaceSymbol, isTypeReference, type TastySymbolModel } from './type-guards.js'

export function collectUserOwnedReferencesFromSymbol(
  symbol: TastySymbolModel
): RawTastySymbolRef[] {
  const refs: RawTastySymbolRef[] = []

  if (isInterfaceSymbol(symbol)) {
    collectInterfaceReferences(symbol, refs)
  } else if (symbol.definition) {
    collectUserOwnedReferencesFromTypeRef(symbol.definition, refs)
  }

  collectFromTypeParameters(symbol.typeParameters, refs)
  return refs
}

function collectInterfaceReferences(
  symbol: RawTastyInterfaceSymbol,
  refs: RawTastySymbolRef[]
) {
  collectHeritageReferences(symbol.extends, refs)
  refs.push(...symbol.types.filter(ref => !ref.typeParameter))
  collectFromMembers(symbol.members, refs)
}

/**
 * Each heritage clause is a reference that may carry type arguments, so it is walked like a
 * member type.
 */
function collectHeritageReferences(
  heritage: RawTastyTypeRef[],
  refs: RawTastySymbolRef[]
) {
  for (const ref of heritage) {
    collectUserOwnedReferencesFromTypeRef(ref, refs)
  }
}

function collectUserOwnedReferencesFromMember(
  member: RawTastyMember,
  refs: RawTastySymbolRef[]
) {
  if (member.type) {
    collectUserOwnedReferencesFromTypeRef(member.type, refs)
  }
}

function collectUserOwnedReferencesFromTypeRef(
  typeRef: RawTastyTypeRef,
  refs: RawTastySymbolRef[]
) {
  if (isTypeReference(typeRef)) {
    collectFromTypeReference(typeRef, refs)
    return
  }
  collectFromStructuredTypeRef(typeRef, refs)
}

function collectFromTypeReference(
  typeRef: RawTastyTypeReference,
  refs: RawTastySymbolRef[]
) {
  // A type parameter or infer name is bound by its declaration, so it is never a dependency.
  if (typeRef.typeParameter) return
  refs.push({
    id: typeRef.id,
    name: typeRef.name,
    library: typeRef.library,
  })
  for (const arg of typeRef.typeArguments ?? []) {
    collectUserOwnedReferencesFromTypeRef(arg, refs)
  }
}

// Containers first: members, unions and intersections, arrays and tuples.
function collectFromStructuredTypeRef(
  typeRef: RawTastyStructuredTypeRef,
  refs: RawTastySymbolRef[]
) {
  switch (typeRef.kind) {
    case 'object':
      collectFromMembers(typeRef.members, refs)
      return
    case 'union':
    case 'intersection':
      collectFromTypeRefs(typeRef.types, refs)
      return
    case 'array':
      collectUserOwnedReferencesFromTypeRef(typeRef.element, refs)
      return
    case 'tuple':
      collectFromTupleElements(typeRef.elements, refs)
      return
    default:
      collectFromSignatureOrOperator(typeRef, refs)
      return
  }
}

// Signatures and operators, whose children are parameters, a return type or a single operand.
function collectFromSignatureOrOperator(
  typeRef: RawTastyStructuredTypeRef,
  refs: RawTastySymbolRef[]
) {
  switch (typeRef.kind) {
    case 'function':
      collectFromParams(typeRef.params, refs)
      collectUserOwnedReferencesFromTypeRef(typeRef.returnType, refs)
      return
    case 'constructor':
      collectFromParams(typeRef.params, refs)
      collectUserOwnedReferencesFromTypeRef(typeRef.returnType, refs)
      collectFromTypeParameters(typeRef.typeParameters, refs)
      return
    case 'indexed_access':
      collectUserOwnedReferencesFromTypeRef(typeRef.object, refs)
      collectUserOwnedReferencesFromTypeRef(typeRef.index, refs)
      collectOptionalTypeRef(typeRef.resolved, refs)
      return
    case 'type_operator':
      collectUserOwnedReferencesFromTypeRef(typeRef.target, refs)
      collectOptionalTypeRef(typeRef.resolved, refs)
      return
    case 'type_query':
      collectOptionalTypeRef(typeRef.resolved, refs)
      return
    default:
      collectFromConditionalFamily(typeRef, refs)
      return
  }
}

// Conditional, mapped and template literal kinds: fixed child fields, plus template parts.
function collectFromConditionalFamily(
  typeRef: RawTastyStructuredTypeRef,
  refs: RawTastySymbolRef[]
) {
  switch (typeRef.kind) {
    case 'conditional':
      collectUserOwnedReferencesFromTypeRef(typeRef.checkType, refs)
      collectUserOwnedReferencesFromTypeRef(typeRef.extendsType, refs)
      collectUserOwnedReferencesFromTypeRef(typeRef.trueType, refs)
      collectUserOwnedReferencesFromTypeRef(typeRef.falseType, refs)
      collectOptionalTypeRef(typeRef.resolved, refs)
      return
    case 'mapped':
      collectUserOwnedReferencesFromTypeRef(typeRef.sourceType, refs)
      collectOptionalTypeRef(typeRef.nameType, refs)
      collectOptionalTypeRef(typeRef.valueType, refs)
      return
    case 'template_literal':
      collectFromTemplateParts(typeRef.parts, refs)
      collectOptionalTypeRef(typeRef.resolved, refs)
      return
    default:
      return
  }
}

function collectFromMembers(members: RawTastyMember[], refs: RawTastySymbolRef[]) {
  for (const member of members) {
    collectUserOwnedReferencesFromMember(member, refs)
  }
}

function collectFromTypeRefs(typeRefs: RawTastyTypeRef[], refs: RawTastySymbolRef[]) {
  for (const item of typeRefs) {
    collectUserOwnedReferencesFromTypeRef(item, refs)
  }
}

function collectFromTupleElements(
  elements: RawTastyTupleElement[],
  refs: RawTastySymbolRef[]
) {
  for (const element of elements) {
    collectUserOwnedReferencesFromTypeRef(element.element, refs)
  }
}

function collectFromTemplateParts(
  parts: RawTastyTemplateLiteralPart[],
  refs: RawTastySymbolRef[]
) {
  for (const part of parts) {
    if (part.kind === 'type') collectUserOwnedReferencesFromTypeRef(part.value, refs)
  }
}

function collectFromParams(params: RawTastyFnParam[], refs: RawTastySymbolRef[]) {
  for (const param of params) {
    collectOptionalTypeRef(param.typeRef, refs)
  }
}

function collectFromTypeParameters(
  typeParameters: RawTastyTypeParameter[] | undefined,
  refs: RawTastySymbolRef[]
) {
  for (const param of typeParameters ?? []) {
    collectOptionalTypeRef(param.constraint, refs)
    collectOptionalTypeRef(param.default, refs)
  }
}

function collectOptionalTypeRef(
  typeRef: RawTastyTypeRef | null | undefined,
  refs: RawTastySymbolRef[]
) {
  if (typeRef) collectUserOwnedReferencesFromTypeRef(typeRef, refs)
}
