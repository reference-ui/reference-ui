// Plugin assembly for Neo microbundle builds from option bags.
// It takes bundling options and emits the esbuild plugins they imply.
// This module is a Neo-owned copy of the core plugin wiring.

import type * as esbuild from 'esbuild'
import type { MicroBundleOptions } from '../types.ts'
import { aliasPlugin } from './alias.ts'
import { mdxPlugin } from './mdx.ts'
import { reactStubPlugin } from './react-stub.ts'

/**
 * Build the esbuild plugins array from microbundle options.
 */
export function getPlugins(options: MicroBundleOptions): esbuild.Plugin[] {
  const plugins: esbuild.Plugin[] = []
  // The MDX loader is inert without an `.mdx` entry, so it registers on every
  // build: bundleFragments, runSingle, and runPlanner all reach it by default.
  plugins.push(mdxPlugin())
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
