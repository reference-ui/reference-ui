// React entry publishing for the Neo generated folder.
// It takes the system name plus compiled style prop names and emits the
// react package: a bundled react.mjs plus standalone react.d.mts. React
// resolves to pinned production builds so the browser bundle stays free of
// node-only branches, while css()/recipe() bundle in pre-registered over
// this system's runtime-data (D4: styled stays data-only).

import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { microBundle } from '../lib/microbundle/index.ts'
import {
  generateReactEntrySource,
  generateReactTypesSource,
} from '../primitives/generate/generate.ts'
import { GENERATED_VERSION } from './publish.ts'

const require = createRequire(import.meta.url)

export interface ReactPublishInput {
  outDir: string
  systemName: string
  stylePropNames: string[]
}

function productionBuild(packageName: string, file: string): string {
  return join(dirname(require.resolve(`${packageName}/package.json`)), 'cjs', file)
}

function reactAliases(): Record<string, string> {
  return {
    react: productionBuild('react', 'react.production.js'),
    'react-dom/client': productionBuild('react-dom', 'react-dom-client.production.js'),
    scheduler: productionBuild('scheduler', 'scheduler.production.js'),
  }
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
    const bundle = await microBundle(entryPath, {
      format: 'esm',
      platform: 'browser',
      // Empty, not absent: the seam defaults to leaving react external.
      external: [],
      alias: reactAliases(),
    })
    writeFileSync(join(dir, 'react.mjs'), bundle, 'utf-8')
  } finally {
    rmSync(entryPath, { force: true })
  }
}
