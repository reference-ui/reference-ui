/**
 * Member identity and dedupe helpers for tasty members.
 * Reads member ids and default values and drops duplicate members by id, keeping the last occurrence.
 */
import type { TastyMember } from './api-types.js'

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
