/**
 * Bundler implementations.
 */

export * from './bundler-interface.js'
export { viteBundler } from './vite.js'
export { webpackBundler } from './webpack.js'
export { rollupBundler } from './rollup.js'

import type { Bundler } from './bundler-interface.js'
import { viteBundler } from './vite.js'
import { webpackBundler } from './webpack.js'
import { rollupBundler } from './rollup.js'

const bundlers: Record<string, Bundler> = {
  vite: viteBundler,
  webpack: webpackBundler,
  rollup: rollupBundler,
}

export function getBundler(name: string): Bundler {
  const bundler = bundlers[name]
  if (!bundler) {
    throw new Error(`Unknown bundler: ${name}. Supported: ${Object.keys(bundlers).join(', ')}`)
  }
  return bundler
}
