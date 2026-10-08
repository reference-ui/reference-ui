// Type-line labels: they take a tasty member plus its type and emit the short
// primary label for the member-type column. Callable and exotic members keep
// semantic-kind words; everything else formats the declared type.

import { getTastyMemberSemanticKind } from '@reference-ui/rust/tasty'
import type { TastyMember, TastySemanticKind, TastyTypeRef } from '@reference-ui/rust/tasty'
import { createReferenceType, formatReferenceType } from './type.ts'

const REFERENCE_TYPE_LABEL_ALIASES = new Map<TastySemanticKind, string>([
  ['type_query', 'typeof'],
  ['template_literal', 'template literal'],
])

export function getReferenceTypeLabel(member: TastyMember, type: TastyTypeRef | undefined): string {
  const semanticKind = getTastyMemberSemanticKind(member)
  if (!type) return 'unknown'

  if (semanticKind === 'function' || semanticKind === 'constructor' || semanticKind === 'index') {
    return REFERENCE_TYPE_LABEL_ALIASES.get(semanticKind) ?? semanticKind
  }

  const referenceType = createReferenceType(type)
  if (referenceType) {
    return formatReferenceType(referenceType)
  }

  return type.describe() ?? REFERENCE_TYPE_LABEL_ALIASES.get(semanticKind) ?? semanticKind
}
