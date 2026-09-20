import type { CssNode } from 'css-tree'

/**
 * Internal-only use of an external type.
 *
 * This file plain-imports `css-tree` but never re-exports from it, so the
 * scan boundary (scanner README) requires the scanner to leave `css-tree`
 * out of the manifest entirely. Contrast `lib-types.ts`, whose re-exports
 * deliberately bridge `csstype` and `json-schema` into the scan.
 */
export interface InternalUsage {
  /** An internal reference that must not document its home package. */
  node?: CssNode
}
