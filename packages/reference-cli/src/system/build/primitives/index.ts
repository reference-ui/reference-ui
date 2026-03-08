#!/usr/bin/env node

import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { createPrimitiveSource } from './generate'

const __filename = fileURLToPath(import.meta.url)
const CLI_ROOT = resolve(dirname(__filename), '../../../..')
const outPath = join(CLI_ROOT, 'src/system/primitives/index.tsx')

export async function buildPrimitives(): Promise<void> {
  const content = createPrimitiveSource(CLI_ROOT)
  writeFileSync(outPath, content, 'utf8')
  console.log(`[build:primitives] Generated ${outPath}`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await buildPrimitives()
}
