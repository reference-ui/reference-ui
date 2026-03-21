import { getTastyMemberSemanticKind } from '@reference-ui/rust/tasty'
import type { TastyMember } from '@reference-ui/rust/tasty'
import type { ReferenceMemberDocument } from '../types'
import { createReferenceMemberSummary } from './summary'
import { getReferenceTypeLabel } from './typeLabel'
import { createReferenceJsDoc, createReferenceType } from './type'

export function createReferenceMemberDocument(member: TastyMember): ReferenceMemberDocument {
  const type = member.getType()
  const typeLabel = getReferenceTypeLabel(member, type)

  return {
    id: member.getId(),
    name: member.getName(),
    kind: member.getKind(),
    optional: member.isOptional(),
    readonly: member.isReadonly(),
    semanticKind: getTastyMemberSemanticKind(member),
    defaultValue: member.getDefaultValue(),
    typeLabel,
    type: createReferenceType(type),
    jsDoc: createReferenceJsDoc(member.getRaw()),
    summary: createReferenceMemberSummary(member, type, typeLabel),
  }
}
