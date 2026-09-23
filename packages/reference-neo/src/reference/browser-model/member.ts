// Member builder: it takes a tasty member plus a symbol lookup and origins and
// emits one serializable `ReferenceMemberDocument` row for the API table. The
// type line prefers the inline-union value-set label, falling back to the
// formatted declared type.

import { getTastyMemberSemanticKind } from '@reference-ui/rust/tasty'
import type { TastyMember, TastySymbol } from '@reference-ui/rust/tasty'
import type { ReferenceMemberDocument, ReferenceSymbolRef } from '../browser/types.ts'
import { createReferenceMemberSummary, getInlineUnionValueSetTypeLabel } from './summary.ts'
import { getReferenceTypeLabel } from './typeLabel.ts'
import { createReferenceJsDoc, createReferenceType } from './type.ts'

export function createReferenceMemberDocument(
  member: TastyMember,
  symbolLookup: Map<string, TastySymbol>,
  origin: {
    declaredBy: ReferenceSymbolRef
    inheritedFrom?: ReferenceSymbolRef
  },
): ReferenceMemberDocument {
  const type = member.getType()
  const typeLabel =
    getInlineUnionValueSetTypeLabel(member, type, symbolLookup) ?? getReferenceTypeLabel(member, type)

  return {
    id: member.getId(),
    name: member.getName(),
    kind: member.getKind(),
    optional: member.isOptional(),
    readonly: member.isReadonly(),
    declaredBy: origin.declaredBy,
    inheritedFrom: origin.inheritedFrom,
    semanticKind: getTastyMemberSemanticKind(member),
    defaultValue: member.getDefaultValue(),
    typeLabel,
    type: createReferenceType(type),
    jsDoc: createReferenceJsDoc(member.getRaw()),
    summary: createReferenceMemberSummary(member, type, typeLabel, symbolLookup),
  }
}
