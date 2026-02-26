/**
 * Webpack bundler implementation.
 * Stub for future expansion - MVP uses Vite only.
 */

import type { Bundler } from './bundler-interface.js'

export const webpackBundler: Bundler = {
  name: 'webpack',
  getConfig(): import('./bundler-interface.js').BundlerConfig {
    throw new Error('Webpack not yet implemented for MVP')
  },
  getBuildCommand(): string[] {
    throw new Error('Webpack not yet implemented for MVP')
  },
  getDevServerCommand(): string[] {
    throw new Error('Webpack not yet implemented for MVP')
  },
}
