import type { TastyMember } from './api-types'

export function getTastyMemberId(member: TastyMember): string {
  return member.getId()
}

export function dedupeTastyMembers(members: TastyMember[]): TastyMember[] {
  const byId = new Map<string, TastyMember>()

  for (const member of members) {
    byId.set(getTastyMemberId(member), member)
  }

  return [...byId.values()]
}

export function getTastyMemberDefaultValue(member: TastyMember): string | undefined {
  return member.getDefaultValue()
}
