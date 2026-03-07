import { createFragmentFunction } from '../../lib/fragments/collector'

export interface BoxPatternExtension {
  properties: Record<string, { type: string }>
  transform: (props: Record<string, unknown>) => Record<string, unknown>
}

const { fn, collector } = createFragmentFunction<BoxPatternExtension>({
  name: 'box-pattern',
  targetFunction: 'extendPattern',
  globalKey: '__refBoxPatternCollector',
})

/**
 * Extend the box pattern with additional properties and transforms.
 * Used by internal prop definitions (font, container, r, etc.).
 *
 * @example
 * ```ts
 * extendPattern({
 *   properties: { container: { type: 'string' } },
 *   transform(props) {
 *     const { container } = props
 *     return container !== undefined
 *       ? { containerType: 'inline-size', ...(container && { containerName: container }) }
 *       : {}
 *   }
 * })
 * ```
 */
export const extendPattern = fn

/**
 * Get the box pattern collector for build scripts.
 * @internal
 */
export function createBoxPatternCollector() {
  return collector
}
