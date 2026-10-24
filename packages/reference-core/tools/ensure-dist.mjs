// core-owned freshness gate for the shipped `ref` CLI: it guarantees
// `dist/bin/ref.js` exists and is newer than every input the compiled bin is
// built from, so no documented caller runs stale bytes. It takes the core
// package root from its own module location, stats the source roots plus the
// tsc project files, and rebuilds through `tools/build-bin.mjs` only when the
// bin is missing or older. Before a rebuild it fills the two generated inputs a
// fresh checkout lacks: the `@reference-ui/rust` JS bindings and the gitignored
// browser-component mirror. A `REF_PIPELINE_SKIP_DEPENDENCY_BUILDS` setting
// exits immediately for CI opt-out, and steady state exits silently after one
// stat walk. `--force` rebuilds regardless of mtimes. The rebuild never empties
// dist/ in place: `build-bin.mjs` builds into a sibling folder and renames it
// into place, so a watcher reading dist/ (the docs dev server) keeps its files.

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG = dirname(dirname(fileURLToPath(import.meta.url)))
const BIN = join(PKG, 'dist', 'bin', 'ref.js')
const BUILD = join(PKG, 'tools', 'build-bin.mjs')
const MIRROR = join(PKG, 'src', 'reference', 'browser-component')
const MIRROR_TOOL = join(PKG, 'tools', 'mirror-reference-component.mjs')
const RUST_PKG = join(PKG, '..', 'reference-rs')
// The rust JS build writes its root declaration entrypoints last, so this file
// marks a finished build; the native build alone also creates dist/.
const RUST_BINDINGS = join(RUST_PKG, 'dist', 'index.d.ts')
const SKIP_ENV = 'REF_PIPELINE_SKIP_DEPENDENCY_BUILDS'

// tsc emits only src and bin; the project files and the build script decide
// what that emit contains, so a change to any of them must refresh dist too.
const INPUT_ROOTS = ['src', 'bin']
const INPUT_FILES = [
  'tools/build-bin.mjs',
  'tools/rewrite-declaration-specifiers.mjs',
  'tsconfig.build.json',
  'tsconfig.json',
  'package.json',
]

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

function run(label, command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })
  if (result.error) {
    console.error(`[ensure-dist] ${label} failed: ${result.error.message}`)
    process.exit(1)
  }
  if (result.status !== 0) process.exit(result.status ?? 1)
}

// Each input keeps its owning tool: the gate only fills one that is missing
// and never refreshes it.
function fillMissingInputs() {
  if (!existsSync(RUST_BINDINGS)) {
    console.log('[ensure-dist] building the @reference-ui/rust JS bindings the bin typechecks against')
    run('rust bindings build', 'pnpm', ['run', 'build:js'], RUST_PKG)
  }
  if (!existsSync(MIRROR) || readdirSync(MIRROR).length === 0) {
    run('reference component mirror', process.execPath, [MIRROR_TOOL], PKG)
  }
}

function build() {
  fillMissingInputs()
  run('build', process.execPath, [BUILD], PKG)
}

if (!process.env[SKIP_ENV]) {
  const built = existsSync(BIN) ? statSync(BIN).mtimeMs : 0
  if (process.argv.includes('--force') || built === 0 || built < newestInputMtime()) build()
}
