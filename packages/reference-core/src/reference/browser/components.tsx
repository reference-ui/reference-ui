import * as React from 'react'
import type { TastyFnParam, TastyMember, TastyTypeRef } from '@reference-ui/rust/tasty'
import { Code, Div, H2, P, Small, Span } from '@reference-ui/react'
import type { ReferenceRuntimeData } from './Runtime'
import type { ReferenceDocument, ReferenceMemberDocument, ReferenceTag } from './types'

interface ReferenceFrameProps {
  children: React.ReactNode
}

interface ReferenceNoticeProps {
  children: React.ReactNode
}

interface ReferenceDocumentViewProps {
  document: ReferenceDocument
}

interface ReferenceTagListProps {
  tags: ReferenceTag[]
}

const MEMBER_GRID_COLUMNS = 'minmax(0, 12rem) minmax(0, 8rem) minmax(0, 1fr)'

export function createReferenceDocument(data: ReferenceRuntimeData): ReferenceDocument {
  return {
    name: data.symbol.getName(),
    kind: data.symbol.getKind(),
    kindLabel: data.symbol.getKind() === 'typeAlias' ? 'Type alias' : 'Interface',
    description: data.symbol.getDescription(),
    typeParameters: data.symbol.getTypeParameters().map(param => param.name),
    extendsNames: data.symbol.getExtends().map(ref => ref.getName()),
    definition: data.symbol.getUnderlyingType()?.describe() ?? null,
    members: dedupeMembers(data.members).map(member => createMemberDocument(member)),
  }
}

export function ReferenceFrame({ children }: ReferenceFrameProps) {
  return (
    <Div
      css={{
        color: 'reference.foreground',
        background: 'reference.background',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'reference.border',
        padding: 'reference.lg',
      }}
    >
      {children}
    </Div>
  )
}

export function ReferenceNotice({ children }: ReferenceNoticeProps) {
  return (
    <P margin="0" color="reference.muted">
      {children}
    </P>
  )
}

export function ReferenceDocumentView({ document }: ReferenceDocumentViewProps) {
  return (
    <Div display="grid" gap="reference.lg">
      <Div display="grid" gap="reference.sm">
        <Div display="flex" alignItems="center" gap="reference.sm" flexWrap="wrap">
          <H2 margin="0" fontSize="1rem" color="reference.foreground">
            <Code fontFamily="reference.mono">{document.name}</Code>
          </H2>
          <Small color="reference.muted">{document.kindLabel}</Small>
        </Div>
        {document.description ? <P margin="0">{document.description}</P> : null}
        {document.typeParameters.length > 0 ? (
          <Small color="reference.muted">Generics: {document.typeParameters.join(', ')}</Small>
        ) : null}
        {document.extendsNames.length > 0 ? (
          <Small color="reference.muted">Extends: {document.extendsNames.join(', ')}</Small>
        ) : null}
      </Div>

      {document.kind === 'typeAlias' ? (
        <ReferenceTypeAliasDefinition definition={document.definition} />
      ) : (
        <ReferenceMemberList members={document.members} />
      )}
    </Div>
  )
}

function ReferenceTypeAliasDefinition({ definition }: { definition: string | null }) {
  return (
    <Div display="grid" gap="reference.sm">
      <Small color="reference.muted">Definition</Small>
      <Code
        display="block"
        fontFamily="reference.mono"
        padding="reference.sm"
        background="reference.subtleBackground"
      >
        {definition ?? 'unknown'}
      </Code>
    </Div>
  )
}

function ReferenceMemberList({ members }: { members: ReferenceMemberDocument[] }) {
  if (members.length === 0) {
    return (
      <Small color="reference.muted">
        No members were emitted for this interface.
      </Small>
    )
  }

  return (
    <Div>
      {members.map(member => (
        <ReferenceMemberRow key={member.id} member={member} />
      ))}
    </Div>
  )
}

function ReferenceMemberRow({ member }: { member: ReferenceMemberDocument }) {
  return (
    <Div
      css={{
        display: 'grid',
        gridTemplateColumns: MEMBER_GRID_COLUMNS,
        columnGap: '1rem',
        alignItems: 'start',
        paddingBlock: '1rem',
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: 'reference.border',
      }}
    >
      <Div>
        <Code fontFamily="reference.mono">{member.name}</Code>
      </Div>

      <Div>
        <Code fontFamily="reference.mono">{member.typeLabel}</Code>
      </Div>

      <Div display="grid" gap="reference.sm">
        {member.tags.length > 0 ? <ReferenceTagList tags={member.tags} /> : null}
        {member.description ? (
          <P margin="0" color="reference.foreground">
            {member.description}
          </P>
        ) : null}
        {member.params.length > 0 ? <ReferenceParamList member={member} /> : null}
      </Div>
    </Div>
  )
}

function ReferenceParamList({ member }: { member: ReferenceMemberDocument }) {
  return (
    <Div display="grid" gap="reference.xs">
      {member.params.map(param => (
        <Div key={`${member.id}-${param.name}`} display="grid" gap="reference.xxs">
          <Div display="flex" alignItems="center" gap="reference.xs" flexWrap="wrap">
            <Small color="reference.muted">Param</Small>
            <Code fontFamily="reference.mono">{param.name}</Code>
            {param.type ? (
              <Small color="reference.muted">
                <Code fontFamily="reference.mono">{param.type}</Code>
              </Small>
            ) : null}
            {param.optional ? <Small color="reference.muted">optional</Small> : null}
          </Div>
          {param.description ? (
            <P margin="0" color="reference.muted">
              {param.description}
            </P>
          ) : null}
        </Div>
      ))}
    </Div>
  )
}

function ReferenceTagList({ tags }: ReferenceTagListProps) {
  return (
    <Div display="flex" gap="reference.sm" flexWrap="wrap">
      {tags.map(tag => (
        <Span
          key={`${tag.highlighted ? 'highlighted' : 'default'}-${tag.label}`}
          css={{
            display: 'inline-flex',
            alignItems: 'center',
            minHeight: '2rem',
            paddingInline: '0.75rem',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: tag.highlighted ? 'reference.foreground' : 'reference.border',
            borderRadius: '0.375rem',
            background: tag.highlighted ? 'reference.foreground' : 'reference.subtleBackground',
            color: tag.highlighted ? 'reference.background' : 'reference.foreground',
          }}
        >
          <Code fontFamily="reference.mono">{tag.label}</Code>
        </Span>
      ))}
    </Div>
  )
}

function dedupeMembers(members: TastyMember[]): TastyMember[] {
  const byId = new Map<string, TastyMember>()

  for (const member of members) {
    byId.set(`${member.getKind()}:${member.getName()}`, member)
  }

  return [...byId.values()]
}

function createMemberDocument(member: TastyMember): ReferenceMemberDocument {
  const type = member.getType()

  return {
    id: `${member.getKind()}:${member.getName()}`,
    name: member.getName(),
    kind: member.getKind(),
    typeLabel: getTypeLabel(member, type),
    tags: createMemberTags(member, type),
    description: member.getDescription(),
    params: createParamDocs(member, type),
  }
}

function getTypeLabel(member: TastyMember, type: TastyTypeRef | undefined): string {
  switch (member.getKind()) {
    case 'method':
    case 'call':
      return 'function'
    case 'construct':
      return 'constructor'
    case 'index':
      return 'index'
    default:
      break
  }

  if (!type) return 'unknown'
  if (type.isLiteral()) return getLiteralKind(type.getLiteralValue())
  if (type.isUnion()) return inferUnionLabel(type)

  switch (type.getKind()) {
    case 'function':
      return 'function'
    case 'constructor':
      return 'constructor'
    case 'array':
      return 'array'
    case 'tuple':
      return 'tuple'
    case 'object':
      return 'object'
    case 'intersection':
      return 'intersection'
    case 'indexed_access':
      return 'indexed'
    case 'type_query':
      return 'typeof'
    case 'conditional':
      return 'conditional'
    case 'mapped':
      return 'mapped'
    case 'template_literal':
      return 'template literal'
    default:
      return type.describe()
  }
}

function inferUnionLabel(type: TastyTypeRef): string {
  const branchKinds = uniqueStrings(type.getUnionTypes().map(getUnionBranchKind).filter(Boolean))
  return branchKinds.length === 1 ? branchKinds[0]! : 'union'
}

function getUnionBranchKind(type: TastyTypeRef): string | null {
  if (type.isLiteral()) return getLiteralKind(type.getLiteralValue())
  if (type.isUnion()) return inferUnionLabel(type)

  switch (type.getKind()) {
    case 'function':
      return 'function'
    case 'constructor':
      return 'constructor'
    case 'intrinsic':
      return type.describe()
    default:
      return null
  }
}

function createMemberTags(member: TastyMember, type: TastyTypeRef | undefined): ReferenceTag[] {
  const defaultValue = normalizeInlineValue(member.getJsDocTag('default')?.getValue())
  const tags: ReferenceTag[] = []

  if (defaultValue) {
    tags.push({ label: defaultValue, highlighted: true })
  }

  for (const label of createTypeTags(type)) {
    if (defaultValue && normalizeInlineValue(label) === defaultValue) continue
    tags.push({ label })
  }

  return uniqueTags(tags)
}

function createTypeTags(type: TastyTypeRef | undefined): string[] {
  if (!type) return []

  if (type.isUnion()) {
    return uniqueStrings(type.getUnionTypes().flatMap(createInlineTags))
  }

  if (type.isLiteral()) {
    return [normalizeInlineValue(type.getLiteralValue()) ?? type.describe()]
  }

  switch (type.getKind()) {
    case 'intrinsic':
      return type.describe() === 'boolean' ? ['true', 'false'] : []
    case 'function':
    case 'constructor':
      return [formatSignature(type)]
    case 'raw':
      return type.getSummary() ? [type.getSummary()!] : []
    default:
      return []
  }
}

function createInlineTags(type: TastyTypeRef): string[] {
  if (type.isUnion()) return type.getUnionTypes().flatMap(createInlineTags)
  if (type.isLiteral()) return [normalizeInlineValue(type.getLiteralValue()) ?? type.describe()]

  switch (type.getKind()) {
    case 'intrinsic':
      return type.describe() === 'boolean' ? ['true', 'false'] : [type.describe()]
    case 'function':
    case 'constructor':
      return [formatSignature(type)]
    case 'raw':
      return type.getSummary() ? [type.getSummary()!] : [type.describe()]
    default:
      return [type.describe()]
  }
}

function createParamDocs(member: TastyMember, type: TastyTypeRef | undefined) {
  if (!type) return []
  if (type.getKind() !== 'function' && type.getKind() !== 'constructor') return []

  const paramDescriptions = new Map(
    member
      .getJsDocTags()
      .filter(tag => tag.getName() === 'param')
      .map(tag => parseParamTag(tag.getValue()))
      .filter((entry): entry is [string, string] => entry != null),
  )

  return type.getParameters().map((param, index) => {
    const name = param.getName() ?? `arg${index + 1}`
    return {
      name,
      type: param.getType()?.describe(),
      optional: param.isOptional(),
      description: paramDescriptions.get(name),
    }
  })
}

function parseParamTag(value: string | undefined): [string, string] | null {
  if (!value) return null

  const cleaned = value.trim().replace(/^\{[^}]+\}\s*/, '')
  const match = cleaned.match(/^(\[[^\]]+\]|\S+)(?:\s*-\s*|\s+)?(.*)$/)
  if (!match) return null

  const rawName = match[1]?.trim()
  if (!rawName) return null

  const name = rawName.replace(/^\[/, '').replace(/\]$/, '').split('=')[0]?.trim()
  if (!name) return null

  return [name, match[2]?.trim() ?? '']
}

function formatSignature(type: TastyTypeRef): string {
  const params = type
    .getParameters()
    .map((param, index) => formatParam(param, index))
    .join(', ')
  const returnType = type.getReturnType()?.describe() ?? 'unknown'
  const prefix = type.getKind() === 'constructor' ? 'new ' : ''

  return `${prefix}(${params}) => ${returnType}`
}

function formatParam(param: TastyFnParam, index: number): string {
  const name = param.getName() ?? `arg${index + 1}`
  const optional = param.isOptional() ? '?' : ''
  const type = param.getType()?.describe() ?? 'unknown'
  return `${name}${optional}: ${type}`
}

function getLiteralKind(value: string | undefined): string {
  const normalized = normalizeInlineValue(value)
  if (normalized === 'true' || normalized === 'false') return 'boolean'
  if (normalized && /^-?\d+(\.\d+)?$/.test(normalized)) return 'number'
  return 'string'
}

function normalizeInlineValue(value: string | undefined): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  const quotedMatch = trimmed.match(/^["'`](.*)["'`]$/)
  return quotedMatch ? quotedMatch[1] : trimmed
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

function uniqueTags(tags: ReferenceTag[]): ReferenceTag[] {
  const seen = new Set<string>()
  const unique: ReferenceTag[] = []

  for (const tag of tags) {
    const key = `${tag.highlighted ? '1' : '0'}:${tag.label}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(tag)
  }

  return unique
}
