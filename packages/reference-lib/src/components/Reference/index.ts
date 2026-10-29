/**
 * Reference public barrel: re-exports only, zero logic. Ships `Reference`,
 * `ReferenceView`, the props type, and the browser token config, keeping member, document,
 * and fixture modules private.
 */
export { referenceBrowserTokenConfig } from './theme/index'
export { Reference } from './Reference'
export { ReferenceView } from './ReferenceView'
export type { ReferenceComponentProps } from './types'
