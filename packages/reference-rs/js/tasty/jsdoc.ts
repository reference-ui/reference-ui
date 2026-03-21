import type { TastyMember } from './api-types'

export function parseTastyParamTag(value: string | undefined): [string, string] | null {
  if (!value) return null

  const cleaned = value.trim().replace(/^\{[^}]+\}\s*/, '')
  const match = cleaned.match(/^(\[[^\]]+\]|\S+)(?:\s*-\s*|\s+)?(.*)$/)
  if (!match) return null

  const rawName = match[1]?.trim()
  if (!rawName) return null

  const name = rawName.replace(/^\[/, '').replace(/\]$/, '').split('=')[0]?.trim()
  if (!name) return null

  return [name, match[2]?.trim() ?? '']
}

export function normalizeTastyInlineValue(value: string | undefined): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  const quotedMatch = trimmed.match(/^["'`](.*)["'`]$/)
  return quotedMatch ? quotedMatch[1] : trimmed
}

export function getTastyJsDocParamDescriptions(member: TastyMember): Map<string, string> {
  return new Map(
    member
      .getJsDocTags()
      .filter(tag => tag.getName() === 'param')
      .map(tag => parseTastyParamTag(tag.getValue()))
      .filter((entry): entry is [string, string] => entry != null),
  )
}
