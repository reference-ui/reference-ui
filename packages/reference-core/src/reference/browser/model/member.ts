import type { TastyMember } from '@reference-ui/rust/tasty'
import type { ReferenceMemberDocument } from '../types'
import { createReferenceMemberSummary } from './summary'
import { getReferenceTypeLabel } from './typeLabel'

export function createReferenceMemberDocument(member: TastyMember): ReferenceMemberDocument {
  const type = member.getType()
  const typeLabel = getReferenceTypeLabel(member, type)

  return {
    id: member.getId(),
    name: member.getName(),
    kind: member.getKind(),
    typeLabel,
    summary: createReferenceMemberSummary(member, type, typeLabel),
  }
}
