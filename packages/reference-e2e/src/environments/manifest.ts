/**
 * Environment manifest: strict file list for test sandboxes.
 * Each matrix entry composes base + override layers. Layers can override any file.
 */

import { existsSync } from 'node:fs'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { MatrixEntry } from '../matrix/index.js'

/** Canonical list of files that make up a sandbox. Paths relative to sandbox root. */
export const MANIFEST = [
  'main.tsx',
  'App.tsx',
  'Router.tsx',
  'routes.ts',
  'index.html',
  'package.json',
  'tokens.ts',
  'tsconfig.json',
  'ui.config.ts',
  'vite.config.ts',
  'tests/TokensTest.tsx',
  'tests/ColorModeTest.tsx',
  'tests/SyncWatch.tsx',
  'tests/ExtendsTest.tsx',
  'tests/LayersTest.tsx',
  'tests/StylePropsTest.tsx',
  'tests/ResponsiveContainerTest.tsx',
] as const

export type ManifestFile = (typeof MANIFEST)[number]

/** Override layers for a matrix entry, in application order (later overrides earlier). */
function getOverrideLayers(entry: MatrixEntry): string[] {
  const envRoot = join(dirname(fileURLToPath(import.meta.url)))
  return [
    join(envRoot, 'base'),
    join(envRoot, 'react', entry.react),
    join(envRoot, 'bundlers', entry.bundler, String(entry.bundlerVersion)),
  ]
}

/**
 * Compose a sandbox: for each manifest file, last layer that has it wins (overrides).
 * Writes to destDir.
 */
export async function composeSandbox(
  entry: MatrixEntry,
  destDir: string
): Promise<void> {
  const layers = getOverrideLayers(entry)

  for (const relPath of MANIFEST) {
    let content: string | null = null
    for (const layerDir of layers) {
      const filePath = join(layerDir, relPath)
      if (existsSync(filePath)) {
        content = await readFile(filePath, 'utf-8')
      }
    }
    if (content === null) {
      throw new Error(
        `Manifest file ${relPath} missing from all layers for ${entry.name}`
      )
    }
    const destPath = join(destDir, relPath)
    await mkdir(dirname(destPath), { recursive: true })
    await writeFile(destPath, content)
  }
}
