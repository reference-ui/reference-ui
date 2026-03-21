import type { TastyMember, TastySymbol } from '@reference-ui/rust/tasty'
import type { ReferenceDocument } from '../types'
import { createReferenceMemberDocument } from './member'

export function createReferenceDocument(
  symbol: TastySymbol,
  members: TastyMember[],
): ReferenceDocument {
  return {
    name: symbol.getName(),
    kind: symbol.getKind(),
    kindLabel: symbol.getKind() === 'typeAlias' ? 'Type alias' : 'Interface',
    description: symbol.getDescription(),
    typeParameters: symbol.getTypeParameters().map((param) => param.name),
    extendsNames: symbol.getExtends().map((ref) => ref.getName()),
    definition: symbol.getUnderlyingType()?.describe() ?? null,
    members: members.map(createReferenceMemberDocument),
  }
}
