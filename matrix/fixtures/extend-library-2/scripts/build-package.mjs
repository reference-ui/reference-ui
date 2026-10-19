/**
 * Fixture pack step: assert the sync output this package publishes.
 * Checks that `.reference-ui/system/baseSystem.*` and the `dist` entrypoints
 * exist after `ref sync` and the lib build, creating `dist/` when needed.
 * Emits nothing: a missing file fails the build with an access error instead
 * of shipping a hollow package.
 */

import { access, mkdir } from 'node:fs/promises'
import { constants } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(packageRoot, 'dist')

const requiredFiles = [
  resolve(packageRoot, '.reference-ui/system/baseSystem.mjs'),
  resolve(packageRoot, '.reference-ui/system/baseSystem.d.mts'),
  resolve(distDir, 'index.mjs'),
  resolve(distDir, 'index.d.ts'),
]

for (const filePath of requiredFiles) {
  await access(filePath, constants.F_OK)
}

await mkdir(distDir, { recursive: true })
