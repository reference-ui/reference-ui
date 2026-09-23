// Reference types publishing for the Neo generated folder.
// It takes the output dir (with the react leg already landed) and emits the
// `@reference-ui/types` package: the bundled types.mjs, its manifest, and
// the declarations. The mirror's `@reference-ui/react` edge aliases to the
// just-generated per-system react bundle, so the reference docs render with
// the consumer system's own primitives; tasty values resolve through node
// to the workspace dist, never through tsconfig discovery.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { microBundleWithResult } from '../lib/microbundle/index.ts'
import { BASE_SYSTEM_HEADER, GENERATED_VERSION } from './publish/types.ts'

export interface ReferenceTypesPublishInput {
  outDir: string
}

const TYPES_RUNTIME_PLACEHOLDER = '__REFERENCE_UI_TYPES_RUNTIME__'
const TYPES_RUNTIME_SPECIFIER = './tasty/runtime.js'

// Core's externals for this package. `@reference-ui/react` stays bundled
// (aliased): the generated entry is react-only, so no react-dom edge can
// leak into types.mjs through it.
const REFERENCE_TYPES_EXTERNALS = [
  '__REFERENCE_UI_TYPES_RUNTIME__',
  'react',
  'react/jsx-runtime',
  '@reference-ui/styled',
  '@reference-ui/styled/*',
  '@reference-ui/types',
  '@reference-ui/types/*',
  'node:fs',
  'node:path',
  'node:crypto',
  'node:url',
  'url',
  'fast-glob',
  'esbuild',
]

function neoFilePath(...parts: string[]): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', ...parts)
}

/**
 * Rewrite the runtime placeholder to the literal tasty edge, with core's
 * triple-guard semantics: the placeholder must be present before, fully
 * gone after, and the literal present after. App bundlers need the real
 * edge for the lazy chunk graph (REF-08).
 */
export function rewriteTypesRuntimeImport(code: string): string {
  if (!code.includes(TYPES_RUNTIME_PLACEHOLDER)) {
    throw new Error(
      `expected @reference-ui/types bundle to contain ${TYPES_RUNTIME_PLACEHOLDER} before postprocess`
    )
  }
  const rewritten = code.replaceAll(TYPES_RUNTIME_PLACEHOLDER, TYPES_RUNTIME_SPECIFIER)
  if (rewritten.includes(TYPES_RUNTIME_PLACEHOLDER)) {
    throw new Error(
      `failed to fully rewrite @reference-ui/types runtime placeholder in bundle`
    )
  }
  if (!rewritten.includes(TYPES_RUNTIME_SPECIFIER)) {
    throw new Error(
      `expected @reference-ui/types bundle to contain ${TYPES_RUNTIME_SPECIFIER} after rewrite`
    )
  }
  return rewritten
}

/**
 * Publish the generated types package: bundle the reference entry (with
 * the per-system react primitives aliased in), rewrite the tasty runtime
 * edge, and write the bundle, manifest, and declarations. Runs after the
 * react leg — the alias target must exist — and before the links leg, so
 * the junction lands on a complete package. The tasty dir itself is
 * session-owned and lands later; this leg never touches it.
 */
export async function publishReferenceTypesBundle(
  input: ReferenceTypesPublishInput
): Promise<void> {
  const bundle = await microBundleWithResult(neoFilePath('entry', 'types.tsx'), {
    format: 'esm',
    platform: 'neutral',
    target: 'es2020',
    external: REFERENCE_TYPES_EXTERNALS,
    // V1a: the neo primitives entry for this sync is the generated react
    // bundle. Without the alias the edge is node-unresolvable and tsconfig
    // discovery would fall back to the types-only surface (empty at
    // runtime); the plugin wins over every resolution regime.
    alias: { '@reference-ui/react': join(input.outDir, 'react', 'react.mjs') },
    // S-P5: explicit tsconfig, never auto-discovery — the tasty and react
    // paths entries point at declaration files, which must never feed a
    // value bundle. Automatic JSX rides the raw options instead.
    tsconfigRaw: { compilerOptions: { jsx: 'react-jsx' } },
    minify: false,
    keepNames: true,
    treeShaking: true,
    sourcemap: false,
  })
  const dir = join(input.outDir, 'types')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'types.mjs'), rewriteTypesRuntimeImport(bundle.code), 'utf-8')
  writeFileSync(
    join(dir, 'package.json'),
    `${JSON.stringify(
      {
        name: '@reference-ui/types',
        version: GENERATED_VERSION,
        description: 'Neo generated reference types entry',
        type: 'module',
        main: './types.mjs',
        types: './types.d.mts',
        exports: {
          '.': { types: './types.d.mts', import: './types.mjs' },
          './manifest': {
            types: './tasty/manifest.d.ts',
            import: './tasty/manifest.js',
          },
          './runtime': {
            types: './tasty/runtime.d.ts',
            import: './tasty/runtime.js',
          },
        },
      },
      null,
      2
    )}\n`,
    'utf-8'
  )
  writeFileSync(
    join(dir, 'types.d.mts'),
    `${BASE_SYSTEM_HEADER}\n${readFileSync(neoFilePath('entry', 'types.d.mts'), 'utf-8')}`,
    'utf-8'
  )
}
