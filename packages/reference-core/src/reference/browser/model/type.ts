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

type RawTaggedTastyTypeRef = Exclude<RawTastyTypeRef, RawTastyTypeReference>
type RawTaggedTastyTypeKind = RawTaggedTastyTypeRef['kind']
type ReferenceTypeKind = ReferenceType['kind']
type ReferenceTypeInput = TastyTypeRef | RawTastyTypeRef | undefined | null

export function createReferenceType(
  type: ReferenceTypeInput,
): ReferenceType | undefined {
  if (!type) return undefined

  const raw = isTastyTypeRef(type) ? type.getRaw() : type
  if (isRawTastyTypeReference(raw)) {
    return {
      kind: 'reference',
      id: raw.id,
      name: raw.name,
      library: raw.library,
      typeArguments: mapReferenceTypes(raw.typeArguments ?? []),
    }
  }

  return rawReferenceTypeFactories[raw.kind](raw as never)
}

export function createReferenceTypeParameter(param: RawTastyTypeParameter): ReferenceTypeParameter {
  return {
    name: param.name,
    constraint: createReferenceType(param.constraint),
    default: createReferenceType(param.default),
  }
}

export function formatReferenceType(type: ReferenceType): string {
  return referenceTypeFormatters[type.kind](type as never)
}

const rawReferenceTypeFactories: {
  [K in RawTaggedTastyTypeKind]: (raw: Extract<RawTaggedTastyTypeRef, { kind: K }>) => ReferenceType
} = {
  intrinsic: (raw) => ({
    kind: 'intrinsic',
    name: raw.name,
  }),
  literal: (raw) => ({
    kind: 'literal',
    value: raw.value,
  }),
  object: (raw) => ({
    kind: 'object',
    members: raw.members.map(createReferenceInlineMember),
  }),
  union: (raw) => ({
    kind: 'union',
    types: mapReferenceTypes(raw.types),
  }),
  array: (raw) => ({
    kind: 'array',
    element: createRequiredReferenceType(raw.element, 'array.element'),
  }),
  tuple: (raw) => ({
    kind: 'tuple',
    elements: raw.elements.map(createReferenceTupleElement),
  }),
  intersection: (raw) => ({
    kind: 'intersection',
    types: mapReferenceTypes(raw.types),
  }),
  indexed_access: (raw) => ({
    kind: 'indexed_access',
    object: createRequiredReferenceType(raw.object, 'indexed_access.object'),
    index: createRequiredReferenceType(raw.index, 'indexed_access.index'),
  }),
  function: (raw) => ({
    kind: 'function',
    params: raw.params.map(createReferenceCallableParameter),
    returnType: createRequiredReferenceType(raw.returnType, 'function.returnType'),
  }),
  constructor: (raw) => ({
    kind: 'constructor',
    abstract: raw.abstract,
    typeParameters: (raw.typeParameters ?? []).map(createReferenceTypeParameter),
    params: raw.params.map(createReferenceCallableParameter),
    returnType: createRequiredReferenceType(raw.returnType, 'constructor.returnType'),
  }),
  type_operator: (raw) => ({
    kind: 'type_operator',
    operator: raw.operator,
    target: createRequiredReferenceType(raw.target, 'type_operator.target'),
  }),
  type_query: (raw) => ({
    kind: 'type_query',
    expression: raw.expression,
  }),
  conditional: (raw) => ({
    kind: 'conditional',
    checkType: createRequiredReferenceType(raw.checkType, 'conditional.checkType'),
    extendsType: createRequiredReferenceType(raw.extendsType, 'conditional.extendsType'),
    trueType: createRequiredReferenceType(raw.trueType, 'conditional.trueType'),
    falseType: createRequiredReferenceType(raw.falseType, 'conditional.falseType'),
  }),
  mapped: (raw) => ({
    kind: 'mapped',
    typeParam: raw.typeParam,
    sourceType: createRequiredReferenceType(raw.sourceType, 'mapped.sourceType'),
    nameType: createReferenceType(raw.nameType),
    optionalModifier: raw.optionalModifier,
    readonlyModifier: raw.readonlyModifier,
    valueType: createReferenceType(raw.valueType),
  }),
  template_literal: (raw) => ({
    kind: 'template_literal',
    parts: raw.parts.map(createReferenceTemplateLiteralPart),
  }),
  raw: (raw) => ({
    kind: 'raw',
    summary: raw.summary,
  }),
}

const referenceTypeFormatters: {
  [K in ReferenceTypeKind]: (type: Extract<ReferenceType, { kind: K }>) => string
} = {
  reference: (type) => (
    type.typeArguments.length > 0
      ? `${type.name}<${type.typeArguments.map(formatReferenceType).join(', ')}>`
      : type.name
  ),
  intrinsic: (type) => type.name,
  literal: (type) => formatReferenceLiteral(type.value),
  object: (type) => `{ ${type.members.map(formatReferenceInlineMember).join('; ')} }`,
  union: (type) => type.types.map(formatReferenceType).join(' | '),
  array: (type) => `${formatReferenceType(type.element)}[]`,
  tuple: (type) => `[${type.elements.map(formatReferenceTupleElement).join(', ')}]`,
  intersection: (type) => type.types.map(formatReferenceType).join(' & '),
  indexed_access: (type) => `${formatReferenceType(type.object)}[${formatReferenceType(type.index)}]`,
  function: (type) => `(${type.params.map(formatReferenceCallableParameter).join(', ')}) => ${formatReferenceType(type.returnType)}`,
  constructor: (type) => {
    const typeParameters = formatReferenceTypeParameters(type.typeParameters)
    return `new ${typeParameters}(${type.params.map(formatReferenceCallableParameter).join(', ')}) => ${formatReferenceType(type.returnType)}`
  },
  type_operator: (type) => `${type.operator} ${formatReferenceType(type.target)}`,
  type_query: (type) => `typeof ${type.expression}`,
  conditional: (type) => (
    `${formatReferenceType(type.checkType)} extends ${formatReferenceType(type.extendsType)} ? ${formatReferenceType(type.trueType)} : ${formatReferenceType(type.falseType)}`
  ),
  mapped: (type) => {
    const readonlyModifier = formatMappedReadonlyModifier(type.readonlyModifier)
    const nameClause = type.nameType ? ` as ${formatReferenceType(type.nameType)}` : ''
    const optionalModifier = formatMappedOptionalModifier(type.optionalModifier)
    const valueType = type.valueType ? formatReferenceType(type.valueType) : 'unknown'
    return `{ ${readonlyModifier}[${type.typeParam} in ${formatReferenceType(type.sourceType)}${nameClause}]${optionalModifier}: ${valueType} }`
  },
  template_literal: (type) => `\`${type.parts.map(formatReferenceTemplateLiteralPart).join('')}\``,
  raw: (type) => type.summary,
}

function mapReferenceTypes(
  items: ReferenceTypeInput[],
): ReferenceType[] {
  return items.flatMap((item) => {
    const typeRef = createReferenceType(item)
    return typeRef ? [typeRef] : []
  })
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
  type: ReferenceTypeInput,
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
