import {
  getTastyTypeInlineVariants,
  getTastyMemberSemanticKind,
  normalizeTastyInlineValue,
} from '@reference-ui/rust/tasty'
import type { TastyMember, TastySemanticKind, TastySymbol, TastyTypeRef } from '@reference-ui/rust/tasty'
import type { ReferenceDocument, ReferenceMemberDocument, ReferenceParamDoc, ReferenceTag } from './types'

const REFERENCE_TYPE_LABEL_ALIASES = new Map<TastySemanticKind, string>([
  ['indexed_access', 'indexed'],
  ['type_query', 'typeof'],
  ['template_literal', 'template literal'],
])

export function createReferenceDocument(
  symbol: TastySymbol,
  members: TastyMember[],
): ReferenceDocument {
  return {
    name: symbol.getName(),
    kind: symbol.getKind(),
    kindLabel: symbol.getKind() === 'typeAlias' ? 'Type alias' : 'Interface',
    description: symbol.getDescription(),
    typeParameters: symbol.getTypeParameters().map(param => param.name),
    extendsNames: symbol.getExtends().map(ref => ref.getName()),
    definition: symbol.getUnderlyingType()?.describe() ?? null,
    members: members.map(createReferenceMemberDocument),
  }
}

function createReferenceMemberDocument(member: TastyMember): ReferenceMemberDocument {
  const type = member.getType()

  return {
    id: member.getId(),
    name: member.getName(),
    kind: member.getKind(),
    typeLabel: getReferenceTypeLabel(member, type),
    tags: createReferenceTags(member, type),
    description: member.getDescription(),
    params: createReferenceParams(member, type),
  }
}

function createReferenceTags(member: TastyMember, type: ReturnType<TastyMember['getType']>): ReferenceTag[] {
  const defaultValue = member.getDefaultValue()
  const variants = getTastyTypeInlineVariants(type)
  const tags: ReferenceTag[] = []

  if (defaultValue) {
    tags.push({ label: defaultValue, highlighted: true })
  }

  for (const variant of variants) {
    if (defaultValue && normalizeTastyInlineValue(variant) === defaultValue) continue
    tags.push({ label: variant })
  }

  return dedupeReferenceTags(tags)
}

function createReferenceParams(
  member: TastyMember,
  _type: ReturnType<TastyMember['getType']>,
): ReferenceParamDoc[] {
  return member.getParameters()
}

function dedupeReferenceTags(tags: ReferenceTag[]): ReferenceTag[] {
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

function getReferenceTypeLabel(member: TastyMember, type: TastyTypeRef | undefined): string {
  const semanticKind = getTastyMemberSemanticKind(member)
  if (semanticKind === 'intrinsic' || semanticKind === 'reference' || semanticKind === 'raw') {
    return type?.describe() ?? 'unknown'
  }
  return REFERENCE_TYPE_LABEL_ALIASES.get(semanticKind) ?? semanticKind
}
