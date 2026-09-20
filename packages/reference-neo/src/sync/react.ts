// React entry publishing for the Neo generated folder.
// It takes the system name plus compiled style prop names and emits the
// react package: a minified bundled react.mjs plus its external map and standalone react.d.mts. React
// stays external (like core's entry): bundling it would fork the dispatcher
// for any consumer rendering through its own react-dom, so the bundle
// imports 'react' + 'react-dom/client' and the consumer provides the copy.
// css()/recipe() bundle in pre-registered over this system's runtime-data
// (D4: styled stays data-only).

import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { microBundleWithResult } from '../lib/microbundle/index.ts'
import {
  generateReactEntrySource,
  generateReactTypesSource,
} from '../primitives/generate/generate.ts'
import { GENERATED_VERSION } from './publish.ts'

export interface ReactPublishInput {
  outDir: string
  systemName: string
  stylePropNames: string[]
}

function runtimeModulePath(...parts: string[]): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', ...parts)
}

function runtimeHeaderSource(dataPath: string): string {
  return [
    `import { css, recipe, registerRecipeData, registerRuntimeData } from ${JSON.stringify(runtimeModulePath('runtime', 'index.ts'))}`,
    `import { runtimeData, systemName } from ${JSON.stringify(dataPath)}`,
    'registerRuntimeData(systemName, runtimeData)',
    'registerRecipeData(systemName, runtimeData.recipes)',
    'export { css, recipe }',
    '',
  ].join('\n')
}

/**
 * Publish the generated react package: bundle the native entry (primitives
 * plus React, with css()/recipe() pre-registered over this system's data)
 * and write the standalone types. Rewrites the placeholder package.json sync
 * published with the folder; the styles.css copy already sits beside it.
 */
export async function publishReactBundle(input: ReactPublishInput): Promise<void> {
  const dir = join(input.outDir, 'react')
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, 'package.json'),
    `${JSON.stringify(
      {
        name: '@reference-ui/react',
        version: GENERATED_VERSION,
        description: 'Neo generated React entry',
        type: 'module',
        main: './react.mjs',
        types: './react.d.mts',
        exports: {
          '.': { types: './react.d.mts', import: './react.mjs' },
          './styles.css': './styles.css',
        },
      },
      null,
      2
    )}\n`,
    'utf-8'
  )
  writeFileSync(
    join(dir, 'react.d.mts'),
    generateReactTypesSource({ stylePropNames: input.stylePropNames }),
    'utf-8'
  )

  // Stable entry path under the output tmp dir: esbuild stamps the entry path
  // into the bundle as a module comment, so a random scratch name would make
  // consecutive syncs differ by bytes (SYNC-06). Scoped per output dir, so
  // concurrent syncs of different projects never share it.
  const entryPath = join(input.outDir, 'tmp', 'react-entry.mts')
  mkdirSync(join(input.outDir, 'tmp'), { recursive: true })
  try {
    writeFileSync(
      entryPath,
      runtimeHeaderSource(join(input.outDir, 'styled', 'runtime-data.mjs')) +
        generateReactEntrySource({
          systemName: input.systemName,
          stylePropNames: input.stylePropNames,
          factoryPath: runtimeModulePath('primitives', 'runtime', 'factory.ts'),
          splitPath: runtimeModulePath('primitives', 'runtime', 'split.ts'),
          contextPath: runtimeModulePath('primitives', 'runtime', 'context.ts'),
        }),
      'utf-8'
    )
    const bundle = await microBundleWithResult(entryPath, {
      format: 'esm',
      platform: 'browser',
      // React rides with the consumer (see header): external, never bundled.
      external: ['react', 'react-dom/client'],
      // Minified with an external map: the shipped bundle holds its size
      // bound while the map keeps it debuggable. Names mangle, so the miss
      // call-site probe keeps only the react.mjs file marker (by design).
      minify: true,
      keepNames: false,
      sourcemap: 'linked',
      outfile: join(dir, 'react.mjs'),
    })
    writeFileSync(join(dir, 'react.mjs'), bundle.code, 'utf-8')
    if (bundle.map !== undefined) {
      writeFileSync(join(dir, 'react.mjs.map'), bundle.map, 'utf-8')
    }
  } finally {
    rmSync(entryPath, { force: true })
  }
}
