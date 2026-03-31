import type { StyleProps } from '../../types'

/**
 * Generated systems augment this registry with concrete font names and weights.
 * The empty interface here keeps the legacy `Reference*` surface augmentable,
 * while the actual font type graph now flows through `src/types`.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ReferenceFontRegistry {}

declare module '../../types/fontRegistry' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface FontRegistry extends ReferenceFontRegistry {}
}

export { StyleProps }
