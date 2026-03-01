/**
 * Package definitions for Reference UI
 */

import type { PackageDefinition } from './package'
import { createBundleExports } from './package'

/**
 * @reference-ui/react - Runtime React components and APIs
 *
 * Bundled into a single ESM file for optimal loading.
 */
export const REACT_PACKAGE: PackageDefinition = {
  name: '@reference-ui/react',
  version: '0.0.0-generated',
  description: 'Reference UI React components and runtime APIs',
  bundle: true,
  entry: 'src/entry/react.ts',
  main: './react.mjs',
  types: './react.d.mts',
  exports: createBundleExports('react', { includeStyles: true }),
  additionalFiles: [{ src: 'src/system/styles.css', dest: 'styles.css' }],
}

/**
 * @reference-ui/system - Build-time design system extension APIs
 *
 * Bundled into a single ESM file for optimal loading.
 */
export const SYSTEM_PACKAGE: PackageDefinition = {
  name: '@reference-ui/system',
  version: '0.0.0-generated',
  description: 'Reference UI design system extension APIs',
  bundle: true,
  entry: 'src/entry/system.ts',
  main: './system.mjs',
  types: './system.d.mts',
  exports: createBundleExports('system'),
}

/**
 * All packages to be bundled/copied
 */
export const PACKAGES: PackageDefinition[] = [REACT_PACKAGE, SYSTEM_PACKAGE]
