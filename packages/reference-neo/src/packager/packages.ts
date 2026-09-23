// Package definitions for Neo generated packages.
// They take nothing and emit the declarative set sync publishes: system, styled, react, types.
// Values are transcribed from the legs verbatim — the definitions own them now, so manifests can only change here.
// One assembly, no phase split: Neo's legs run as a single ordered chain, not event-gated runtime/final phases.

import type { PackageDefinition } from './package/index.ts'
import { createBundleExports } from './package/index.ts'
import { GENERATED_VERSION } from './constants.ts'

const TYPES_MANIFEST_JS = './tasty/manifest.js'
const TYPES_MANIFEST_D_TS = './tasty/manifest.d.ts'
const TYPES_RUNTIME_JS = './tasty/runtime.js'
const TYPES_RUNTIME_D_TS = './tasty/runtime.d.ts'

/**
 * @reference-ui/system - Authoring entry plus the portable base system.
 */
export const SYSTEM_PACKAGE: PackageDefinition = {
  name: '@reference-ui/system',
  version: GENERATED_VERSION,
  description: 'Neo generated design system',
  main: './system.mjs',
  types: './system.d.mts',
  exports: {
    '.': { types: './system.d.mts', import: './system.mjs' },
    './baseSystem': { types: './baseSystem.d.mts', import: './baseSystem.mjs' },
  },
}

/**
 * @reference-ui/styled - Stylesheet plus runtime data (data-only: no executable css module lives here).
 */
export const STYLED_PACKAGE: PackageDefinition = {
  name: '@reference-ui/styled',
  version: GENERATED_VERSION,
  description: 'Neo generated styled output',
  main: './runtime-data.mjs',
  types: './index.d.ts',
  exports: {
    '.': { types: './index.d.ts', import: './runtime-data.mjs' },
    './runtime-data': { import: './runtime-data.mjs' },
    './styles.css': './styles.css',
    './tokens': { types: './tokens.d.ts' },
    './types': { types: './types/index.d.ts' },
    './types/*': { types: './types/*.d.ts' },
  },
}

/**
 * @reference-ui/react - Runtime React entry with css()/recipe() bound to this system's data.
 */
export const REACT_PACKAGE: PackageDefinition = {
  name: '@reference-ui/react',
  version: GENERATED_VERSION,
  description: 'Neo generated React entry',
  main: './react.mjs',
  types: './react.d.mts',
  exports: createBundleExports('react', { includeStyles: true }),
  copyFrom: [{ kind: 'file', from: 'outDir', src: 'styled/styles.css', dest: 'styles.css' }],
}

/**
 * @reference-ui/types - Reference runtime entry plus generated Tasty metadata.
 */
export const TYPES_PACKAGE: PackageDefinition = {
  name: '@reference-ui/types',
  version: GENERATED_VERSION,
  description: 'Neo generated reference types entry',
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

/** The generated set in assembly order: shells before the bundles that read them, links last. */
export const PACKAGES: PackageDefinition[] = [SYSTEM_PACKAGE, STYLED_PACKAGE, REACT_PACKAGE, TYPES_PACKAGE]
