// Author extendPattern() call plus its fragment collector.
// It takes box pattern extensions from fragment files and emits collected entries.
// This module is a Neo-owned copy of the core box pattern collector.

import { createFragmentFunction } from '../lib/collector.ts'

export interface BoxPatternProperty {
  type: string
}

export interface BoxPatternExtension {
  properties: Record<string, BoxPatternProperty>
  transform: (props: Record<string, unknown>) => Record<string, unknown>
}

const { fn, collector } = createFragmentFunction<BoxPatternExtension>({
  name: 'box-pattern',
  targetFunction: 'extendPattern',
  globalKey: '__refBoxPatternCollector',
})

/**
 * Extend the box pattern with additional properties and transform logic.
 * Called from fragment files; collected during sync.
 */
export function extendPattern(extension: BoxPatternExtension): void {
  fn(extension)
}

/** Used by the sync runner to collect box pattern extensions. */
export function createBoxPatternCollector() {
  return collector
}
