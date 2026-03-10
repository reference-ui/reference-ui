import { createFragmentFunction } from '../../lib/fragments/collector'

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
 * Extend the Panda box pattern with additional properties and transform logic.
 * Called from fragment files; collected during config generation.
 */
export function extendPattern(extension: BoxPatternExtension): void {
  fn(extension)
}

/** Used by runConfig and build/styled to collect box pattern extensions. */
export function createBoxPatternCollector() {
  return collector
}
