/**
 * Package definitions for Reference UI.
 * Source: @reference-ui/core
 */

import type { PackageDefinition } from './package'
import { createBundleExports } from './package'

/** Paths relative to @reference-ui/core package root */
const ENTRIES = {
  system: 'src/entry/system.ts',
  react: 'src/entry/react.ts',
  types: 'src/entry/types.ts',
} as const

const GENERATED_VERSION = '0.0.0-generated'
const STYLED_INDEX_JS = './css/index.js'
const STYLED_INDEX_D_TS = './css/index.d.ts'
const TYPES_MANIFEST_JS = './tasty/manifest.js'
const TYPES_MANIFEST_D_TS = './tasty/manifest.d.ts'
const TYPES_RUNTIME_JS = './tasty/runtime.js'
const TYPES_RUNTIME_D_TS = './tasty/runtime.d.ts'

export const SOURCE_PACKAGE = '@reference-ui/core'

/**
 * @reference-ui/system - Build-time design system extension APIs
 */
export const SYSTEM_PACKAGE: PackageDefinition = {
  name: '@reference-ui/system',
  version: GENERATED_VERSION,
  description: 'Reference UI design system extension APIs',
  bundle: true,
  entry: ENTRIES.system,
  main: './system.mjs',
  types: './system.d.mts',
  exports: {
    ...createBundleExports('system'),
    './baseSystem': {
      types: './baseSystem.d.mts',
      import: './baseSystem.mjs',
    },
  },
}

/**
 * @reference-ui/react - Runtime React components and APIs
 */
export const REACT_PACKAGE: PackageDefinition = {
  name: '@reference-ui/react',
  version: GENERATED_VERSION,
  description: 'Reference UI React components and runtime APIs',
  bundle: true,
  entry: ENTRIES.react,
  main: './react.mjs',
  types: './react.d.mts',
  exports: createBundleExports('react', { includeStyles: true }),
  copyFrom: [
    { kind: 'file', from: 'outDir', src: 'styled/styles.css', dest: 'styles.css' },
  ],
  postprocess: ['injectLayerName'],
}

/**
 * @reference-ui/styled - Panda output (css, cva, patterns)
 * Content comes from Panda (runs before packager). Packager only writes package.json.
 */
export const STYLED_PACKAGE: PackageDefinition = {
  name: '@reference-ui/styled',
  version: GENERATED_VERSION,
  description: 'Reference UI styled system (Panda CSS output)',
  bundle: false,
  main: STYLED_INDEX_JS,
  types: STYLED_INDEX_D_TS,
  exports: {
    '.': { types: STYLED_INDEX_D_TS, import: STYLED_INDEX_JS },
    './css': { types: STYLED_INDEX_D_TS, import: STYLED_INDEX_JS },
    './css/cva': { types: './css/cva.d.ts', import: './css/cva.js' },
    './css/cx': { types: './css/cx.d.ts', import: './css/cx.js' },
    './css/sva': { types: './css/sva.d.ts', import: './css/sva.js' },
    './jsx': { types: './jsx/index.d.ts', import: './jsx/index.js' },
    './patterns': { types: './patterns/index.d.ts', import: './patterns/index.js' },
    './patterns/box': { types: './patterns/box.d.ts', import: './patterns/box.js' },
  },
}

/**
 * @reference-ui/types - Reference runtime entry plus generated Tasty metadata.
 * Tasty JavaScript content is emitted directly by the reference worker into .reference-ui/types/tasty.
 */
export const TYPES_PACKAGE: PackageDefinition = {
  name: '@reference-ui/types',
  version: GENERATED_VERSION,
  description: 'Reference UI types runtime and generated Tasty metadata',
  bundle: true,
  entry: ENTRIES.types,
  main: './types.mjs',
  types: './types.d.mts',
  exports: {
    ...createBundleExports('types'),
    './manifest': {
      types: TYPES_MANIFEST_D_TS,
      import: TYPES_MANIFEST_JS,
    },
    './runtime': {
      types: TYPES_RUNTIME_D_TS,
      import: TYPES_RUNTIME_JS,
    },
  },
  postprocess: ['rewriteTypesRuntimeImport'],
}

export const RUNTIME_PACKAGES: PackageDefinition[] = [
  REACT_PACKAGE,
  SYSTEM_PACKAGE,
  STYLED_PACKAGE,
]

export const FINAL_PACKAGES: PackageDefinition[] = [
  TYPES_PACKAGE,
]

export const PACKAGES: PackageDefinition[] = [
  ...RUNTIME_PACKAGES,
  ...FINAL_PACKAGES,
]
