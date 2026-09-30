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
import { BASE_SYSTEM_HEADER } from './constants.ts'
import { TYPES_BUNDLE_EXTERNALS } from './externals.ts'
import { writePackageJson } from './manifest.ts'
import { TYPES_PACKAGE } from './packages.ts'
import { runPostprocess } from './postprocess/index.ts'

export interface ReferenceTypesPublishInput {
  outDir: string
}

function neoFilePath(...parts: string[]): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', ...parts)
}

/**
 * Publish the generated types package: bundle the reference entry (with
 * the per-system react primitives aliased in), rewrite the tasty runtime
 * edge, and write the bundle, manifest, and declarations. Runs after the
 * react leg — the alias target must exist. Sync links the packages after
 * the commit, so the junction lands on a complete package. The tasty dir
 * itself is session-owned and lands later; this leg never touches it.
 */
export async function publishReferenceTypesBundle(
  input: ReferenceTypesPublishInput
): Promise<void> {
  const bundle = await microBundleWithResult(neoFilePath('entry', 'types.tsx'), {
    format: 'esm',
    platform: 'neutral',
    target: 'es2020',
    external: TYPES_BUNDLE_EXTERNALS,
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
  writeFileSync(join(dir, 'types.mjs'), runPostprocess(bundle.code, TYPES_PACKAGE), 'utf-8')
  writePackageJson(dir, TYPES_PACKAGE)
  writeFileSync(
    join(dir, 'types.d.mts'),
    `${BASE_SYSTEM_HEADER}\n${readFileSync(neoFilePath('entry', 'types.d.mts'), 'utf-8')}`,
    'utf-8'
  )
}
