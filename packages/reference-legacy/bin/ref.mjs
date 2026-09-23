#!/usr/bin/env node

import { access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const distEntry = join(packageRoot, 'dist/cli/index.mjs')

async function exists(path) {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

if (await exists(distEntry)) {
  await import(pathToFileURL(distEntry).href)
} else {
  console.error(
    'The Reference UI CLI has not been built yet. Run `pnpm --filter @reference-ui/core run build` first.'
  )
  process.exitCode = 1
}
