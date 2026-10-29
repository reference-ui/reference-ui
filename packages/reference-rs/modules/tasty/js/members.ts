/**
 * Member identity and dedupe helpers for tasty members.
 * Reads member ids and default values and drops duplicate members by id, keeping the last declaration. The
 * overloads of one method sit next to each other, so a run of neighbours sharing an id is one declaration and is kept whole.
 */
import type { TastyMember } from './api-types.js'

export function getTastyMemberId(member: TastyMember): string {
  return member.getId()
}

export function dedupeTastyMembers(members: TastyMember[]): TastyMember[] {
  const byId = new Map<string, TastyMember[]>()
  let previousId: string | undefined

  for (const member of members) {
    const id = getTastyMemberId(member)
    const run = id === previousId ? byId.get(id) : undefined
    if (run) run.push(member)
    else byId.set(id, [member])
    previousId = id
  }

  return [...byId.values()].flat()
}

export function getTastyMemberDefaultValue(member: TastyMember): string | undefined {
  return member.getDefaultValue()
}
