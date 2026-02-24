/**
 * Internal: extend the box pattern with additional properties and transforms.
 *
 * Each prop file uses pattern() from styled/api, which delegates here.
 * At build time, createBoxPattern collects these and emits the combined box.ts.
 */

export const BOX_PATTERN_COLLECTOR_KEY = '__boxPatternCollector'

export interface BoxPatternExtension {
  properties: Record<string, any>
  transform: (props: Record<string, any>) => Record<string, any>
}

if (!(globalThis as Record<string, unknown>)[BOX_PATTERN_COLLECTOR_KEY]) {
  ;(globalThis as Record<string, unknown>)[BOX_PATTERN_COLLECTOR_KEY] = []
}

export function extendBoxPattern(extension: BoxPatternExtension): void {
  const collector = (globalThis as Record<string, unknown>)[
    BOX_PATTERN_COLLECTOR_KEY
  ] as BoxPatternExtension[]
  collector.push(extension)
}

export function getBoxPatternExtensions(): BoxPatternExtension[] {
  return (
    ((globalThis as Record<string, unknown>)[
      BOX_PATTERN_COLLECTOR_KEY
    ] as BoxPatternExtension[]) || []
  )
}
