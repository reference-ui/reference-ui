/**
 * Reference module surface.
 * Exposes the browser renderer and the Tasty bridge layer.
 */
import * as browser from './browser'
import * as bridge from './bridge'

export { browser, bridge }
export { referenceBrowserTokenConfig } from './browser'
export { copyReferenceBrowserToVirtual } from './bridge/copy-browser-virtual'

export const Reference = {
  browser,
  bridge,
} as const
