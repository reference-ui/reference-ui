import type {
  RawTastyFnParam,
  RawTastyMember,
  RawTastyTemplateLiteralPart,
  RawTastyTupleElement,
  RawTastyTypeParameter,
  RawTastyTypeRef,
  RawTastyTypeReference,
  TastyTypeRef,
} from '@reference-ui/rust/tasty'
import type {
  ReferenceCallableParameter,
  ReferenceInlineMember,
  ReferenceJsDoc,
  ReferenceTemplateLiteralPart,
  ReferenceTupleElement,
  ReferenceType,
  ReferenceTypeParameter,
} from '../types'

export function createReferenceType(
  type: TastyTypeRef | RawTastyTypeRef | undefined | null,
): ReferenceType | undefined {
  if (!type) return undefined

  const raw = isTastyTypeRef(type) ? type.getRaw() : type
  if (isRawTastyTypeReference(raw)) {
    return {
      kind: 'reference',
      id: raw.id,
      name: raw.name,
      library: raw.library,
      typeArguments: (raw.typeArguments ?? []).flatMap((item) => {
        const typeRef = createReferenceType(item)
        return typeRef ? [typeRef] : []
      }),
    }
  }

  switch (raw.kind) {
    case 'intrinsic':
      return {
        kind: 'intrinsic',
        name: raw.name,
      }
    case 'literal':
      return {
        kind: 'literal',
        value: raw.value,
      }
    case 'object':
      return {
        kind: 'object',
        members: raw.members.map(createReferenceInlineMember),
      }
    case 'union':
      return {
        kind: 'union',
        types: raw.types.flatMap((item) => {
          const typeRef = createReferenceType(item)
          return typeRef ? [typeRef] : []
        }),
      }
    case 'array': {
      const element = createRequiredReferenceType(raw.element, 'array.element')
      return {
        kind: 'array',
        element,
      }
    }
    case 'tuple':
      return {
        kind: 'tuple',
        elements: raw.elements.map(createReferenceTupleElement),
      }
    case 'intersection':
      return {
        kind: 'intersection',
        types: raw.types.flatMap((item) => {
          const typeRef = createReferenceType(item)
          return typeRef ? [typeRef] : []
        }),
      }
    case 'indexed_access': {
      const object = createRequiredReferenceType(raw.object, 'indexed_access.object')
      const index = createRequiredReferenceType(raw.index, 'indexed_access.index')
      return {
        kind: 'indexed_access',
        object,
        index,
      }
    }
    case 'function': {
      const returnType = createRequiredReferenceType(raw.returnType, 'function.returnType')
      return {
        kind: 'function',
        params: raw.params.map(createReferenceCallableParameter),
        returnType,
      }
    }
    case 'constructor': {
      const returnType = createRequiredReferenceType(raw.returnType, 'constructor.returnType')
      return {
        kind: 'constructor',
        abstract: raw.abstract,
        typeParameters: (raw.typeParameters ?? []).map(createReferenceTypeParameter),
        params: raw.params.map(createReferenceCallableParameter),
        returnType,
      }
    }
    case 'type_operator': {
      const target = createRequiredReferenceType(raw.target, 'type_operator.target')
      return {
        kind: 'type_operator',
        operator: raw.operator,
        target,
      }
    }
    case 'type_query':
      return {
        kind: 'type_query',
        expression: raw.expression,
      }
    case 'conditional': {
      const checkType = createRequiredReferenceType(raw.checkType, 'conditional.checkType')
      const extendsType = createRequiredReferenceType(raw.extendsType, 'conditional.extendsType')
      const trueType = createRequiredReferenceType(raw.trueType, 'conditional.trueType')
      const falseType = createRequiredReferenceType(raw.falseType, 'conditional.falseType')
      return {
        kind: 'conditional',
        checkType,
        extendsType,
        trueType,
        falseType,
      }
    }
    case 'mapped': {
      const sourceType = createRequiredReferenceType(raw.sourceType, 'mapped.sourceType')
      return {
        kind: 'mapped',
        typeParam: raw.typeParam,
        sourceType,
        nameType: createReferenceType(raw.nameType),
        optionalModifier: raw.optionalModifier,
        readonlyModifier: raw.readonlyModifier,
        valueType: createReferenceType(raw.valueType),
      }
    }
    case 'template_literal':
      return {
        kind: 'template_literal',
        parts: raw.parts.map(createReferenceTemplateLiteralPart),
      }
    case 'raw':
      return {
        kind: 'raw',
        summary: raw.summary,
      }
    default:
      return undefined
  }
}

export function createReferenceTypeParameter(param: RawTastyTypeParameter): ReferenceTypeParameter {
  return {
    name: param.name,
    constraint: createReferenceType(param.constraint),
    default: createReferenceType(param.default),
  }
}

export function formatReferenceType(type: ReferenceType): string {
  switch (type.kind) {
    case 'reference':
      return type.typeArguments.length > 0
        ? `${type.name}<${type.typeArguments.map(formatReferenceType).join(', ')}>`
        : type.name
    case 'intrinsic':
      return type.name
    case 'literal':
      return formatReferenceLiteral(type.value)
    case 'object':
      return `{ ${type.members.map(formatReferenceInlineMember).join('; ')} }`
    case 'union':
      return type.types.map(formatReferenceType).join(' | ')
    case 'array':
      return `${formatReferenceType(type.element)}[]`
    case 'tuple':
      return `[${type.elements.map(formatReferenceTupleElement).join(', ')}]`
    case 'intersection':
      return type.types.map(formatReferenceType).join(' & ')
    case 'indexed_access':
      return `${formatReferenceType(type.object)}[${formatReferenceType(type.index)}]`
    case 'function':
      return `(${type.params.map(formatReferenceCallableParameter).join(', ')}) => ${formatReferenceType(type.returnType)}`
    case 'constructor': {
      const typeParameters = formatReferenceTypeParameters(type.typeParameters)
      return `new ${typeParameters}(${type.params
        .map(formatReferenceCallableParameter)
        .join(', ')}) => ${formatReferenceType(type.returnType)}`
    }
    case 'type_operator':
      return `${type.operator} ${formatReferenceType(type.target)}`
    case 'type_query':
      return `typeof ${type.expression}`
    case 'conditional':
      return `${formatReferenceType(type.checkType)} extends ${formatReferenceType(type.extendsType)} ? ${formatReferenceType(type.trueType)} : ${formatReferenceType(type.falseType)}`
    case 'mapped': {
      const readonlyModifier = formatMappedReadonlyModifier(type.readonlyModifier)
      const nameClause = type.nameType ? ` as ${formatReferenceType(type.nameType)}` : ''
      const optionalModifier = formatMappedOptionalModifier(type.optionalModifier)
      const valueType = type.valueType ? formatReferenceType(type.valueType) : 'unknown'
      return `{ ${readonlyModifier}[${type.typeParam} in ${formatReferenceType(type.sourceType)}${nameClause}]${optionalModifier}: ${valueType} }`
    }
    case 'template_literal':
      return `\`${type.parts.map(formatReferenceTemplateLiteralPart).join('')}\``
    case 'raw':
      return type.summary
    default:
      return 'unknown'
  }
}

function formatReferenceLiteral(value: string): string {
  const trimmed = value.trim()
  if (trimmed.startsWith("'") || trimmed.startsWith('"') || trimmed.startsWith('`')) {
    return trimmed
  }
  const isPrimitiveLiteral =
    /^[+-]?\d+(\.\d+)?$/.test(trimmed) || trimmed === 'true' || trimmed === 'false'
  if (isPrimitiveLiteral) {
    return trimmed
  }
  return JSON.stringify(trimmed)
}

function createReferenceInlineMember(member: RawTastyMember): ReferenceInlineMember {
  return {
    name: member.name,
    kind: member.kind,
    optional: member.optional,
    readonly: member.readonly,
    description: member.description,
    descriptionRaw: member.descriptionRaw,
    jsDoc: createReferenceJsDoc(member),
    type: createReferenceType(member.type),
  }
}

function formatReferenceInlineMember(member: ReferenceInlineMember): string {
  const readonlyPrefix = member.readonly ? 'readonly ' : ''
  const optionalSuffix = member.optional ? '?' : ''
  const typeLabel = member.type ? formatReferenceType(member.type) : 'unknown'
  return `${readonlyPrefix}${member.name}${optionalSuffix}: ${typeLabel}`
}

function formatReferenceCallableParameter(param: ReferenceCallableParameter, index: number): string {
  const name = param.name ?? `arg${index + 1}`
  const optional = param.optional ? '?' : ''
  const typeLabel = param.type ? formatReferenceType(param.type) : 'unknown'
  return `${name}${optional}: ${typeLabel}`
}

function formatReferenceTupleElement(element: ReferenceTupleElement): string {
  let label = ''
  if (element.label) {
    const optionalSuffix = element.optional ? '?' : ''
    label = `${element.label}${optionalSuffix}: `
  }
  const prefix = element.rest ? '...' : ''
  return `${prefix}${label}${formatReferenceType(element.element)}`
}

function formatReferenceTemplateLiteralPart(part: ReferenceTemplateLiteralPart): string {
  return part.kind === 'text' ? part.value : `\${${formatReferenceType(part.value)}}`
}

function formatReferenceTypeParameters(typeParameters: ReferenceTypeParameter[]): string {
  if (typeParameters.length === 0) return ''
  return `<${typeParameters.map(formatReferenceTypeParameter).join(', ')}>`
}

export function formatReferenceTypeParameter(param: ReferenceTypeParameter): string {
  const constraint = param.constraint ? ` extends ${formatReferenceType(param.constraint)}` : ''
  const defaultValue = param.default ? ` = ${formatReferenceType(param.default)}` : ''
  return `${param.name}${constraint}${defaultValue}`
}

function formatMappedReadonlyModifier(modifier: 'preserve' | 'add' | 'remove'): string {
  switch (modifier) {
    case 'add':
      return 'readonly '
    case 'remove':
      return '-readonly '
    default:
      return ''
  }
}

function formatMappedOptionalModifier(modifier: 'preserve' | 'add' | 'remove'): string {
  switch (modifier) {
    case 'add':
      return '?'
    case 'remove':
      return '-?'
    default:
      return ''
  }
}

function createReferenceCallableParameter(param: RawTastyFnParam): ReferenceCallableParameter {
  return {
    name: param.name,
    optional: param.optional,
    type: createReferenceType(param.typeRef),
  }
}

function createReferenceTupleElement(element: RawTastyTupleElement): ReferenceTupleElement {
  return {
    label: element.label,
    optional: element.optional,
    rest: element.rest,
    element: createRequiredReferenceType(element.element, 'tuple.element'),
  }
}

function createReferenceTemplateLiteralPart(part: RawTastyTemplateLiteralPart): ReferenceTemplateLiteralPart {
  if (part.kind === 'text') {
    return {
      kind: 'text',
      value: part.value,
    }
  }

  return {
    kind: 'type',
    value: createRequiredReferenceType(part.value, 'template_literal.type'),
  }
}

export function createReferenceJsDoc(raw: {
  description?: string
  descriptionRaw?: string
  jsdoc?: { summary?: string; tags: Array<{ name: string; value?: string }> }
}): ReferenceJsDoc {
  return {
    summary: raw.jsdoc?.summary,
    description: raw.description,
    descriptionRaw: raw.descriptionRaw,
    tags: (raw.jsdoc?.tags ?? []).map((tag) => ({
      name: tag.name,
      value: tag.value,
    })),
  }
}

function createRequiredReferenceType(
  type: TastyTypeRef | RawTastyTypeRef | undefined | null,
  path: string,
): ReferenceType {
  const referenceType = createReferenceType(type ?? undefined)
  if (!referenceType) {
    throw new Error(`Expected tasty type at ${path}`)
  }
  return referenceType
}

function isTastyTypeRef(value: TastyTypeRef | RawTastyTypeRef): value is TastyTypeRef {
  return typeof value === 'object' && value != null && 'getRaw' in value
}

function isRawTastyTypeReference(raw: RawTastyTypeRef): raw is RawTastyTypeReference {
  return !('kind' in raw)
}
