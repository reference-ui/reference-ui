import type { TastyMember } from './api-types'
import { normalizeTastyInlineValue } from './jsdoc'

export function getTastyMemberId(member: TastyMember): string {
  return `${member.getKind()}:${member.getName()}`
}

export function dedupeTastyMembers(members: TastyMember[]): TastyMember[] {
  const byId = new Map<string, TastyMember>()

  for (const member of members) {
    byId.set(getTastyMemberId(member), member)
  }

  return [...byId.values()]
}

export function getTastyMemberDefaultValue(member: TastyMember): string | undefined {
  return normalizeTastyInlineValue(member.getJsDocTag('default')?.getValue())
}
