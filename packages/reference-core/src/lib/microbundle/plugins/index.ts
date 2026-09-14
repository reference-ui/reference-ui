import type * as esbuild from 'esbuild'
import type { MicroBundleOptions } from '../types'
import { aliasPlugin } from './alias'
import { reactStubPlugin } from './react-stub'

/**
 * Build the esbuild plugins array from microbundle options.
 */
export function getPlugins(options: MicroBundleOptions): esbuild.Plugin[] {
  const plugins: esbuild.Plugin[] = []
  if (options.reactStub) {
    plugins.push(reactStubPlugin())
  }
  if (options.alias && Object.keys(options.alias).length > 0) {
    plugins.push(aliasPlugin(options.alias))
  }
  if (options.plugins && options.plugins.length > 0) {
    plugins.push(...options.plugins)
  }
  return plugins
}
