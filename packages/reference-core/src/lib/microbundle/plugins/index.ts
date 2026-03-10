import type * as esbuild from 'esbuild'
import type { MicroBundleOptions } from '../types'
import { aliasPlugin } from './alias'

/**
 * Build the esbuild plugins array from microbundle options.
 */
export function getPlugins(options: MicroBundleOptions): esbuild.Plugin[] {
  const plugins: esbuild.Plugin[] = []
  if (options.alias && Object.keys(options.alias).length > 0) {
    plugins.push(aliasPlugin(options.alias))
  }
  return plugins
}
