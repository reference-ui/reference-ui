import type { FontDefinition } from '../../../api/font'
import { warnOnTokenCollisions } from './tokens'
import {
  getConfigFragmentSourceLabel,
  isUserspaceConfigFragment,
  MAX_CONFIG_COLLISIONS_TO_PRINT,
  warnConfigDiagnostic,
} from './types'

interface ConfigDiagnosticsInput {
  tokens?: Record<string, unknown>[]
  fonts?: FontDefinition[]
  keyframes?: Record<string, unknown>[]
}

interface NamedCollision {
  name: string
  sources: string[]
}

function collectNamedCollisions(
  entries: Iterable<{ name: string; source: string }>
): NamedCollision[] {
  const sourcesByName = new Map<string, Set<string>>()
  const countsByName = new Map<string, number>()

  for (const entry of entries) {
    sourcesByName.set(entry.name, sourcesByName.get(entry.name) ?? new Set<string>())
    sourcesByName.get(entry.name)?.add(entry.source)
    countsByName.set(entry.name, (countsByName.get(entry.name) ?? 0) + 1)
  }

  return [...sourcesByName.entries()]
    .filter(([name]) => (countsByName.get(name) ?? 0) > 1)
    .map(([name, sources]) => ({ name, sources: [...sources].sort() }))
    .sort((left, right) => left.name.localeCompare(right.name))
}

function createNamedCollisionWarning(input: {
  label: string
  noun: string
  description: string
  recommendation: string
  collisions: NamedCollision[]
}): string {
  const shown = input.collisions.slice(0, MAX_CONFIG_COLLISIONS_TO_PRINT)
  const hiddenCount = input.collisions.length - shown.length
  const details = shown
    .map((collision, index) =>
      [
        `  ${index + 1}. ${collision.name}`,
        ...collision.sources.map(source => `     - ${source}`),
      ].join('\n')
    )
    .join('\n')
  const suffix = hiddenCount > 0 ? `\n  ... and ${hiddenCount} more` : ''

  return [
    `[${input.label}] ${input.noun} collisions detected.`,
    input.description,
    '',
    `Colliding ${input.noun.toLowerCase()}:`,
    `${details}${suffix}`,
    '',
    input.recommendation,
  ].join('\n')
}

function warnOnFontCollisions(fonts: FontDefinition[]): void {
  const collisions = collectNamedCollisions(
    fonts
      .filter(isUserspaceConfigFragment)
      .map(font => ({
        name: font.name,
        source: getConfigFragmentSourceLabel(font),
      }))
  )
  if (collisions.length === 0) return

  warnConfigDiagnostic(
    createNamedCollisionWarning({
      label: 'fonts',
      noun: 'Font',
      description:
        'Reference UI merges font() definitions by name, so later definitions may override tokens, font faces, recipes, and pattern behavior.',
      recommendation:
        'Consider keeping each font name in one file, or rename one definition if both are meant to coexist.',
      collisions,
    })
  )
}

function getKeyframeCollisionEntries(
  fragments: Record<string, unknown>[]
): Array<{ name: string; source: string }> {
  return fragments.flatMap(fragment => {
    if (!isUserspaceConfigFragment(fragment)) return []
    const source = getConfigFragmentSourceLabel(fragment)
    return Object.keys(fragment).map(name => ({ name, source }))
  })
}

function warnOnKeyframeCollisions(fragments: Record<string, unknown>[]): void {
  const collisions = collectNamedCollisions(getKeyframeCollisionEntries(fragments))
  if (collisions.length === 0) return

  warnConfigDiagnostic(
    createNamedCollisionWarning({
      label: 'keyframes',
      noun: 'Keyframe',
      description:
        'Reference UI deep-merges keyframes fragments, so repeated keyframe names may override animation steps.',
      recommendation:
        'Consider keeping each keyframe name in one file, or rename one animation if both are meant to coexist.',
      collisions,
    })
  )
}

export function warnOnConfigCollisions(input: ConfigDiagnosticsInput): void {
  warnOnTokenCollisions(input.tokens ?? [])
  warnOnFontCollisions(input.fonts ?? [])
  warnOnKeyframeCollisions(input.keyframes ?? [])
}
