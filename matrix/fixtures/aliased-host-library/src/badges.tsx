import { createBadge } from './shell'

/**
 * Factory products: the fixture's generated icons. Each is a `forwardRef`
 * component closing over the aliased shell — the shape StyleTrace must
 * trace from the consumer's node_modules without seeing this source.
 */
export const CheckBadge = createBadge('check', 'CheckBadge')
export const CopyBadge = createBadge('copy', 'CopyBadge')
