/**
 * Package definitions for Reference UI.
 * Source: @reference-ui/cli
 */

import type { PackageDefinition } from './package'
import { createBundleExports } from './package'

/** Paths relative to @reference-ui/cli package root */
const ENTRIES = {
  system: 'src/entry/system.ts',
  react: 'src/entry/react.ts',
} as const

/**
 * @reference-ui/system - Build-time design system extension APIs
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
  },
}

/**
 * @reference-ui/react - Runtime React components and APIs
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
}

/**
 * @reference-ui/styled - Panda output (css, cva, patterns)
 * Content comes from Panda (runs before packager). Packager only writes package.json.
 */
export const STYLED_PACKAGE: PackageDefinition = {
  name: '@reference-ui/styled',
  version: '0.0.0-generated',
  description: 'Reference UI styled system (Panda CSS output)',
  bundle: false,
  main: './css/index.mjs',
  types: './css/index.d.ts',
  exports: {
    '.': { types: './css/index.d.ts', import: './css/index.mjs' },
    './css': { types: './css/index.d.ts', import: './css/index.mjs' },
    './css/cva': { types: './css/cva.d.ts', import: './css/cva.mjs' },
    './css/cx': { types: './css/cx.d.ts', import: './css/cx.mjs' },
    './css/sva': { types: './css/sva.d.ts', import: './css/sva.mjs' },
    './patterns': { types: './patterns/index.d.ts', import: './patterns/index.mjs' },
    './patterns/box': { types: './patterns/box.d.ts', import: './patterns/box.mjs' },
  },
}

export const PACKAGES: PackageDefinition[] = [
  REACT_PACKAGE,
  SYSTEM_PACKAGE,
  STYLED_PACKAGE,
]
