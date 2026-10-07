// Neo-owned freshness gate for the shipped `ref` CLI: it guarantees
// `dist/bin/ref.js` exists and is newer than every input the compiled bin is
// built from, so no documented caller runs stale bytes. It takes the neo
// package root from its own module location, stats the source roots plus the
// tsc project files, and rebuilds through `tools/build-bin.mjs` only when the
// bin is missing or older. A `REF_PIPELINE_SKIP_DEPENDENCY_BUILDS` setting
// exits immediately for CI opt-out, and steady state exits silently after one
// stat walk.

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG = dirname(dirname(fileURLToPath(import.meta.url)))
const BIN = join(PKG, 'dist', 'bin', 'ref.js')
const BUILD = join(PKG, 'tools', 'build-bin.mjs')
const SKIP_ENV = 'REF_PIPELINE_SKIP_DEPENDENCY_BUILDS'

// tsc emits only src and bin; the project files and the build script decide
// what that emit contains, so a change to any of them must refresh dist too.
const INPUT_ROOTS = ['src', 'bin']
const INPUT_FILES = ['tools/build-bin.mjs', 'tsconfig.build.json', 'tsconfig.json', 'package.json']

// Mirrors tsconfig.build.json: fixtures, tests, and the emit tree never reach
// the bin, so touching them must not trigger a rebuild.
const EXCLUDED = /(^|[/\\])(?:__fixtures__|node_modules|dist)([/\\]|$)/
const TEST_FILE = /\.test\.[cm]?[jt]sx?$/

function walkNewest(dir, newest) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (EXCLUDED.test(full.slice(PKG.length + 1))) continue
    if (entry.isDirectory()) newest = walkNewest(full, newest)
    else if (entry.isFile() && !TEST_FILE.test(entry.name)) {
      newest = Math.max(newest, statSync(full).mtimeMs)
    }
  }
  return newest
}

function newestInputMtime() {
  let newest = 0
  for (const root of INPUT_ROOTS) newest = walkNewest(join(PKG, root), newest)
  for (const rel of INPUT_FILES) {
    const full = join(PKG, rel)
    if (existsSync(full)) newest = Math.max(newest, statSync(full).mtimeMs)
  }
  return newest
}

function build() {
  const result = spawnSync(process.execPath, [BUILD], { cwd: PKG, stdio: 'inherit' })
  if (result.error) {
    console.error(`[ensure-dist] build failed: ${result.error.message}`)
    process.exit(1)
  }
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (!process.env[SKIP_ENV]) {
  const built = existsSync(BIN) ? statSync(BIN).mtimeMs : 0
  if (built === 0 || built < newestInputMtime()) build()
}
