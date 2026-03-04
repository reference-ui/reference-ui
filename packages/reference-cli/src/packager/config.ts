/**
 * Packager configuration
 *
 * Defines which packages to bundle and how to package them.
 *
 * CURRENT STATE: Bundles from @reference-ui/core (old architecture).
 *
 * FUTURE: Move APIs into reference-cli, have Panda output directly to outDir.
 * See ARCHITECTURE.md for the migration plan.
 */

import type { PackageDefinition } from './package'
import { createBundleExports } from './package'

/**
 * Source package that provides the design system code to bundle.
 * The packager resolves this at runtime and bundles its entry points.
 *
 * Currently: @reference-ui/core (has the old extendTokens, etc. APIs)
 * Future: Will be replaced by reference-cli's own src/api/
 */
export const SOURCE_PACKAGE = '@reference-ui/core'

/**
 * Entry points in the source package
 *
 * These paths are relative to SOURCE_PACKAGE's root.
 */
export const ENTRIES = {
  /** Design system extension APIs (tokens, recipes, patterns, etc.) */
  system: 'src/entry/system.ts',
  
  /** React components and runtime APIs */
  react: 'src/entry/react.ts',
} as const

/**
 * Additional files to copy from source package
 */
export const ADDITIONAL_FILES = {
  /** Compiled styles from Panda CSS */
  styles: 'src/system/styles.css',
} as const

/**
 * @reference-ui/system - Build-time design system extension APIs
 *
 * Bundled from @reference-ui/core into a single ESM file.
 * Provides: tokens(), recipe(), slotRecipe(), keyframes(), font(), globalCss()
 */
export const SYSTEM_PACKAGE: PackageDefinition = {
  name: '@reference-ui/system',
  version: '0.0.0-generated',
  description: 'Reference UI design system extension APIs',
  bundle: true,
  entry: ENTRIES.system,
  main: './system.mjs',
  types: './system.d.mts',
  exports: {
    ...createBundleExports('system'),
    './baseSystem': './baseSystem.mjs',
  },
}

/**
 * @reference-ui/react - Runtime React components and APIs
 *
 * Bundled from @reference-ui/core into a single ESM file.
 * Includes styles.css for importing in apps.
 */
export const REACT_PACKAGE: PackageDefinition = {
  name: '@reference-ui/react',
  version: '0.0.0-generated',
  description: 'Reference UI React components and runtime APIs',
  bundle: true,
  entry: ENTRIES.react,
  main: './react.mjs',
  types: './react.d.mts',
  exports: createBundleExports('react', { includeStyles: true }),
  additionalFiles: [
    { src: ADDITIONAL_FILES.styles, dest: 'styles.css' }
  ],
}

/**
 * All packages to bundle and install.
 * Output location: {outDir}/react/, {outDir}/system/
 */
export const PACKAGES: PackageDefinition[] = [
  REACT_PACKAGE,
  SYSTEM_PACKAGE,
]
