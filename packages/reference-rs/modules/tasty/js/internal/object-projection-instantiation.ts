/**
 * Typescript source file for Reference UI module.
 * Contains JS API logic and types.
 */
import type {
  RawTastyFnParam,
  RawTastyMember,
  RawTastyStructuredTypeRef,
  RawTastyTypeAliasSymbol,
  RawTastyTypeParameter,
  RawTastyTypeRef,
  RawTastyTypeReference,
} from '../api-types.js'
import { isTypeReference } from './shared.js'

export type TypeSubstitutions = Map<string, RawTastyTypeRef>

// The structured variant with kind K, so each family helper is typed to the kinds it owns.
type StructuredOf<K extends RawTastyStructuredTypeRef['kind']> = Extract<
  RawTastyStructuredTypeRef,
  { kind: K }
>

export function instantiateTypeAliasDefinition(
  symbol: RawTastyTypeAliasSymbol,
  typeArguments: RawTastyTypeRef[] | undefined
): RawTastyTypeRef | undefined {
  if (!symbol.definition) return undefined

  const substitutions = buildTypeSubstitutions(symbol.typeParameters ?? [], typeArguments)
  if (substitutions.size === 0) return symbol.definition

  return instantiateTypeRef(symbol.definition, substitutions)
}

export function buildTypeSubstitutions(
  typeParameters: RawTastyTypeParameter[],
  typeArguments: RawTastyTypeRef[] | undefined
): TypeSubstitutions {
  const substitutions = new Map<string, RawTastyTypeRef>()

  for (const [index, parameter] of typeParameters.entries()) {
    // A default is evaluated where the earlier parameters hold their arguments:
    // `B = A` takes A's argument.
    const argument =
      typeArguments?.[index] ??
      (parameter.default
        ? instantiateTypeRef(parameter.default, substitutions)
        : undefined)
    if (argument) {
      substitutions.set(parameter.name, argument)
    }
  }

  return substitutions
}

export function instantiateTypeRef(
  typeRef: RawTastyTypeRef,
  substitutions: TypeSubstitutions
): RawTastyTypeRef {
  if (isTypeReference(typeRef)) {
    return instantiateReference(typeRef, substitutions)
  }
  return instantiateStructuredTypeRef(typeRef, substitutions)
}

// Structured kinds dispatch through one small switch per family, so no single switch holds every kind.
function instantiateStructuredTypeRef(
  typeRef: RawTastyStructuredTypeRef,
  substitutions: TypeSubstitutions
): RawTastyTypeRef {
  switch (typeRef.kind) {
    case 'object':
      return instantiateObjectTypeRef(typeRef, substitutions)
    case 'union':
    case 'intersection':
      return instantiateCompoundTypeRef(typeRef, substitutions)
    case 'array':
      return instantiateArrayTypeRef(typeRef, substitutions)
    case 'tuple':
      return instantiateTupleTypeRef(typeRef, substitutions)
    default:
      return instantiateSignatureOrAccessTypeRef(typeRef, substitutions)
  }
}

function instantiateObjectTypeRef(
  typeRef: StructuredOf<'object'>,
  substitutions: TypeSubstitutions
): RawTastyTypeRef {
  return {
    ...typeRef,
    members: typeRef.members.map(member => instantiateMember(member, substitutions)),
  }
}

function instantiateCompoundTypeRef(
  typeRef: StructuredOf<'union' | 'intersection'>,
  substitutions: TypeSubstitutions
): RawTastyTypeRef {
  return {
    ...typeRef,
    types: typeRef.types.map(item => instantiateTypeRef(item, substitutions)),
  }
}

function instantiateArrayTypeRef(
  typeRef: StructuredOf<'array'>,
  substitutions: TypeSubstitutions
): RawTastyTypeRef {
  return {
    ...typeRef,
    element: instantiateTypeRef(typeRef.element, substitutions),
  }
}

function instantiateTupleTypeRef(
  typeRef: StructuredOf<'tuple'>,
  substitutions: TypeSubstitutions
): RawTastyTypeRef {
  return {
    ...typeRef,
    elements: typeRef.elements.map(element => ({
      ...element,
      element: instantiateTypeRef(element.element, substitutions),
    })),
  }
}

// Signatures and operator-style kinds; anything else is handed to the conditional family.
function instantiateSignatureOrAccessTypeRef(
  typeRef: RawTastyStructuredTypeRef,
  substitutions: TypeSubstitutions
): RawTastyTypeRef {
  switch (typeRef.kind) {
    case 'function':
      return instantiateFunctionTypeRef(typeRef, substitutions)
    case 'constructor':
      return instantiateConstructorTypeRef(typeRef, substitutions)
    case 'indexed_access':
      return instantiateIndexedAccessTypeRef(typeRef, substitutions)
    case 'type_operator':
      return instantiateTypeOperatorTypeRef(typeRef, substitutions)
    case 'type_query':
      return instantiateTypeQueryTypeRef(typeRef, substitutions)
    default:
      return instantiateConditionalFamilyTypeRef(typeRef, substitutions)
  }
}

function instantiateFunctionTypeRef(
  typeRef: StructuredOf<'function'>,
  substitutions: TypeSubstitutions
): RawTastyTypeRef {
  return {
    ...typeRef,
    params: typeRef.params.map(param => instantiateFnParam(param, substitutions)),
    returnType: instantiateTypeRef(typeRef.returnType, substitutions),
  }
}

function instantiateConstructorTypeRef(
  typeRef: StructuredOf<'constructor'>,
  substitutions: TypeSubstitutions
): RawTastyTypeRef {
  return {
    ...typeRef,
    params: typeRef.params.map(param => instantiateFnParam(param, substitutions)),
    returnType: instantiateTypeRef(typeRef.returnType, substitutions),
    typeParameters: typeRef.typeParameters?.map(param =>
      instantiateTypeParameter(param, substitutions)
    ),
  }
}

function instantiateIndexedAccessTypeRef(
  typeRef: StructuredOf<'indexed_access'>,
  substitutions: TypeSubstitutions
): RawTastyTypeRef {
  return {
    ...typeRef,
    object: instantiateTypeRef(typeRef.object, substitutions),
    index: instantiateTypeRef(typeRef.index, substitutions),
    resolved: instantiateOptionalTypeRef(typeRef.resolved, substitutions),
  }
}

function instantiateTypeOperatorTypeRef(
  typeRef: StructuredOf<'type_operator'>,
  substitutions: TypeSubstitutions
): RawTastyTypeRef {
  return {
    ...typeRef,
    target: instantiateTypeRef(typeRef.target, substitutions),
    resolved: instantiateOptionalTypeRef(typeRef.resolved, substitutions),
  }
}

function instantiateTypeQueryTypeRef(
  typeRef: StructuredOf<'type_query'>,
  substitutions: TypeSubstitutions
): RawTastyTypeRef {
  return {
    ...typeRef,
    resolved: instantiateOptionalTypeRef(typeRef.resolved, substitutions),
  }
}

// Conditional and mapped kinds, plus template literals; leaf kinds such as intrinsics come back as they are.
function instantiateConditionalFamilyTypeRef(
  typeRef: RawTastyStructuredTypeRef,
  substitutions: TypeSubstitutions
): RawTastyTypeRef {
  switch (typeRef.kind) {
    case 'conditional':
      return instantiateConditionalTypeRef(typeRef, substitutions)
    case 'mapped':
      return instantiateMappedTypeRef(typeRef, substitutions)
    case 'template_literal':
      return instantiateTemplateLiteralTypeRef(typeRef, substitutions)
    default:
      return typeRef
  }
}

function instantiateConditionalTypeRef(
  typeRef: StructuredOf<'conditional'>,
  substitutions: TypeSubstitutions
): RawTastyTypeRef {
  return {
    ...typeRef,
    checkType: instantiateTypeRef(typeRef.checkType, substitutions),
    extendsType: instantiateTypeRef(typeRef.extendsType, substitutions),
    trueType: instantiateTypeRef(typeRef.trueType, substitutions),
    falseType: instantiateTypeRef(typeRef.falseType, substitutions),
    resolved: instantiateOptionalTypeRef(typeRef.resolved, substitutions),
  }
}

function instantiateMappedTypeRef(
  typeRef: StructuredOf<'mapped'>,
  substitutions: TypeSubstitutions
): RawTastyTypeRef {
  return {
    ...typeRef,
    sourceType: instantiateTypeRef(typeRef.sourceType, substitutions),
    nameType: instantiateOptionalTypeRef(typeRef.nameType, substitutions),
    valueType: typeRef.valueType
      ? instantiateTypeRef(typeRef.valueType, substitutions)
      : null,
  }
}

function instantiateTemplateLiteralTypeRef(
  typeRef: StructuredOf<'template_literal'>,
  substitutions: TypeSubstitutions
): RawTastyTypeRef {
  return {
    ...typeRef,
    parts: typeRef.parts.map(part =>
      part.kind === 'type'
        ? { ...part, value: instantiateTypeRef(part.value, substitutions) }
        : part
    ),
    resolved: instantiateOptionalTypeRef(typeRef.resolved, substitutions),
  }
}

// An absent optional target stays undefined, so the emitted object keeps the same shape.
function instantiateOptionalTypeRef(
  typeRef: RawTastyTypeRef | undefined,
  substitutions: TypeSubstitutions
): RawTastyTypeRef | undefined {
  return typeRef ? instantiateTypeRef(typeRef, substitutions) : undefined
}

function instantiateReference(
  reference: RawTastyTypeReference,
  substitutions: TypeSubstitutions
): RawTastyTypeRef {
  const substitution =
    reference.id === reference.name ? substitutions.get(reference.name) : undefined
  if (substitution) {
    return substitution
  }

  return {
    ...reference,
    typeArguments: reference.typeArguments?.map(item =>
      instantiateTypeRef(item, substitutions)
    ),
  }
}

export function instantiateMember(
  member: RawTastyMember,
  substitutions: TypeSubstitutions
): RawTastyMember {
  return {
    ...member,
    type: member.type ? instantiateTypeRef(member.type, substitutions) : member.type,
  }
}

function instantiateFnParam(
  param: RawTastyFnParam,
  substitutions: TypeSubstitutions
): RawTastyFnParam {
  return {
    ...param,
    typeRef: param.typeRef
      ? instantiateTypeRef(param.typeRef, substitutions)
      : param.typeRef,
  }
}

function instantiateTypeParameter(
  parameter: RawTastyTypeParameter,
  substitutions: TypeSubstitutions
): RawTastyTypeParameter {
  return {
    ...parameter,
    constraint: parameter.constraint
      ? instantiateTypeRef(parameter.constraint, substitutions)
      : parameter.constraint,
    default: parameter.default
      ? instantiateTypeRef(parameter.default, substitutions)
      : parameter.default,
  }
}
