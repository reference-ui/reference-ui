import type {
  RawTastyFnParam,
  RawTastyMember,
  RawTastyTypeAliasSymbol,
  RawTastyTypeParameter,
  RawTastyTypeRef,
  RawTastyTypeReference,
} from '../api-types'
import { isTypeReference } from './shared'

type TypeSubstitutions = Map<string, RawTastyTypeRef>

export function instantiateTypeAliasDefinition(
  symbol: RawTastyTypeAliasSymbol,
  typeArguments: RawTastyTypeRef[] | undefined,
): RawTastyTypeRef | undefined {
  if (!symbol.definition) return undefined

  const substitutions = buildTypeSubstitutions(symbol.typeParameters ?? [], typeArguments)
  if (substitutions.size === 0) return symbol.definition

  return instantiateTypeRef(symbol.definition, substitutions)
}

function buildTypeSubstitutions(
  typeParameters: RawTastyTypeParameter[],
  typeArguments: RawTastyTypeRef[] | undefined,
): TypeSubstitutions {
  const substitutions = new Map<string, RawTastyTypeRef>()

  for (const [index, parameter] of typeParameters.entries()) {
    const argument = typeArguments?.[index] ?? parameter.default
    if (argument) {
      substitutions.set(parameter.name, argument)
    }
  }

  return substitutions
}

function instantiateTypeRef(typeRef: RawTastyTypeRef, substitutions: TypeSubstitutions): RawTastyTypeRef {
  if (isTypeReference(typeRef)) {
    return instantiateReference(typeRef, substitutions)
  }

  switch (typeRef.kind) {
    case 'object':
      return {
        ...typeRef,
        members: typeRef.members.map((member) => instantiateMember(member, substitutions)),
      }
    case 'union':
    case 'intersection':
      return {
        ...typeRef,
        types: typeRef.types.map((item) => instantiateTypeRef(item, substitutions)),
      }
    case 'array':
      return {
        ...typeRef,
        element: instantiateTypeRef(typeRef.element, substitutions),
      }
    case 'tuple':
      return {
        ...typeRef,
        elements: typeRef.elements.map((element) => ({
          ...element,
          element: instantiateTypeRef(element.element, substitutions),
        })),
      }
    case 'indexed_access':
      return {
        ...typeRef,
        object: instantiateTypeRef(typeRef.object, substitutions),
        index: instantiateTypeRef(typeRef.index, substitutions),
        resolved: typeRef.resolved ? instantiateTypeRef(typeRef.resolved, substitutions) : undefined,
      }
    case 'function':
      return {
        ...typeRef,
        params: typeRef.params.map((param) => instantiateFnParam(param, substitutions)),
        returnType: instantiateTypeRef(typeRef.returnType, substitutions),
      }
    case 'constructor':
      return {
        ...typeRef,
        params: typeRef.params.map((param) => instantiateFnParam(param, substitutions)),
        returnType: instantiateTypeRef(typeRef.returnType, substitutions),
        typeParameters: typeRef.typeParameters?.map((param) => instantiateTypeParameter(param, substitutions)),
      }
    case 'type_operator':
      return {
        ...typeRef,
        target: instantiateTypeRef(typeRef.target, substitutions),
        resolved: typeRef.resolved ? instantiateTypeRef(typeRef.resolved, substitutions) : undefined,
      }
    case 'type_query':
      return {
        ...typeRef,
        resolved: typeRef.resolved ? instantiateTypeRef(typeRef.resolved, substitutions) : undefined,
      }
    case 'conditional':
      return {
        ...typeRef,
        checkType: instantiateTypeRef(typeRef.checkType, substitutions),
        extendsType: instantiateTypeRef(typeRef.extendsType, substitutions),
        trueType: instantiateTypeRef(typeRef.trueType, substitutions),
        falseType: instantiateTypeRef(typeRef.falseType, substitutions),
        resolved: typeRef.resolved ? instantiateTypeRef(typeRef.resolved, substitutions) : undefined,
      }
    case 'mapped':
      return {
        ...typeRef,
        sourceType: instantiateTypeRef(typeRef.sourceType, substitutions),
        nameType: typeRef.nameType ? instantiateTypeRef(typeRef.nameType, substitutions) : undefined,
        valueType: typeRef.valueType ? instantiateTypeRef(typeRef.valueType, substitutions) : null,
      }
    case 'template_literal':
      return {
        ...typeRef,
        parts: typeRef.parts.map((part) =>
          part.kind === 'type' ? { ...part, value: instantiateTypeRef(part.value, substitutions) } : part
        ),
        resolved: typeRef.resolved ? instantiateTypeRef(typeRef.resolved, substitutions) : undefined,
      }
    default:
      return typeRef
  }
}

function instantiateReference(
  reference: RawTastyTypeReference,
  substitutions: TypeSubstitutions,
): RawTastyTypeRef {
  const substitution = reference.id === reference.name ? substitutions.get(reference.name) : undefined
  if (substitution) {
    return substitution
  }

  return {
    ...reference,
    typeArguments: reference.typeArguments?.map((item) => instantiateTypeRef(item, substitutions)),
  }
}

function instantiateMember(member: RawTastyMember, substitutions: TypeSubstitutions): RawTastyMember {
  return {
    ...member,
    type: member.type ? instantiateTypeRef(member.type, substitutions) : undefined,
  }
}

function instantiateFnParam(param: RawTastyFnParam, substitutions: TypeSubstitutions): RawTastyFnParam {
  return {
    ...param,
    typeRef: param.typeRef ? instantiateTypeRef(param.typeRef, substitutions) : undefined,
  }
}

function instantiateTypeParameter(
  parameter: RawTastyTypeParameter,
  substitutions: TypeSubstitutions,
): RawTastyTypeParameter {
  return {
    ...parameter,
    constraint: parameter.constraint ? instantiateTypeRef(parameter.constraint, substitutions) : undefined,
    default: parameter.default ? instantiateTypeRef(parameter.default, substitutions) : undefined,
  }
}
