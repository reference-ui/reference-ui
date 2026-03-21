import { getTastyMemberSemanticKind } from '@reference-ui/rust/tasty'
import type { TastyMember, TastySemanticKind, TastyTypeRef } from '@reference-ui/rust/tasty'

const REFERENCE_TYPE_LABEL_ALIASES = new Map<TastySemanticKind, string>([
  ['indexed_access', 'indexed'],
  ['type_query', 'typeof'],
  ['template_literal', 'template literal'],
])

export function getReferenceTypeLabel(member: TastyMember, type: TastyTypeRef | undefined): string {
  const semanticKind = getTastyMemberSemanticKind(member)
  if (semanticKind === 'intrinsic' || semanticKind === 'reference' || semanticKind === 'raw') {
    return type?.describe() ?? 'unknown'
  }
  return REFERENCE_TYPE_LABEL_ALIASES.get(semanticKind) ?? semanticKind
}
