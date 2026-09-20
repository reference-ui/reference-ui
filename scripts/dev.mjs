#!/usr/bin/env node
// Root `pnpm dev [target]` router. pnpm appends CLI args to the script body,
// so a bare `pnpm dev:docs` target turned `pnpm dev lib` into a 4th
// concurrently command named "lib" (ENOENT 127 -> --kill-others-on-fail tore
// the docs stack down). Route explicitly instead; default stays docs.
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ROUTES = { lib: 'dev:lib', docs: 'dev:docs' }

const [target = 'docs', ...rest] = process.argv.slice(2)
if (!Object.hasOwn(ROUTES, target) || rest.length > 0) {
  console.error(`usage: pnpm dev [${Object.keys(ROUTES).join(' | ')}] (default: docs)`)
  process.exit(2)
}

const child = spawnSync('pnpm', [ROUTES[target]], { cwd: ROOT, stdio: 'inherit' })
process.exit(child.status ?? 1)
