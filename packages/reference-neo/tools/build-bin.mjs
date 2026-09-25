// Builds the compiled ref bin into dist/ (FIX-3: packed installs cannot
// type-strip bin/ref.ts under node_modules). It runs tsc over the build
// tsconfig, asserts the alias-literal set is exactly the known one, then
// lays the esbuild-entry twins plus the runtime-read declaration asset
// beside the emit and makes the bin executable. Run from the Neo package
// directory: node tools/build-bin.mjs (also the prepack/prepublishOnly hook).

import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG = dirname(dirname(fileURLToPath(import.meta.url)))
const DIST = join(PKG, 'dist')

// Path-computing sources and the exact .ts/.tsx/.d.mts literals each may
// carry on its resolve()/neoFilePath()/runtimeModulePath() call sites.
// These literals name esbuild entry files resolved from import.meta.url at
// sync time; tsc emits .js/.jsx, so the build lays same-named twins
// (transpiled content) at the computed paths. Any drift fails the build
// loudly — never ship a silent miss.
const PATH_LITERAL_SOURCES = new Map([
  ['src/config/bundle.ts', ['index.ts']],
  ['src/collect/lib/bootstrap.ts', ['index.ts', 'react-unbound.ts']],
  ['src/packager/react.ts', ['index.ts']],
  ['src/packager/reference-types.ts', ['types.d.mts', 'types.tsx']],
])

// Twin copies: transpiled emit duplicated under the computed .ts/.tsx name
// so the alias entries resolve. Content is plain JS (esbuild parses it);
// node never loads these paths — every node import points at .js/.jsx.
const TWINS = [
  ['src/index.js', 'src/index.ts'],
  ['src/entry/react-unbound.js', 'src/entry/react-unbound.ts'],
  ['src/entry/types.js', 'src/entry/types.tsx'],
  ['src/runtime/index.js', 'src/runtime/index.ts'],
]

// Verbatim asset copies: package-relative files sync reads at runtime that
// tsc never emits (declaration inputs, JSON shelves).
const ASSETS = [
  ['src/entry/types.d.mts', 'src/entry/types.d.mts'],
  [
    'src/native/generated/primitives/vocabulary.json',
    'src/native/generated/primitives/vocabulary.json',
  ],
]

function fail(message) {
  console.error(`[ref build] ${message}`)
  process.exit(1)
}

function runTsc() {
  const require = createRequire(join(PKG, 'tools', 'build-bin.mjs'))
  let tscPath
  try {
    const pkgJson = require.resolve('typescript/package.json')
    tscPath = join(dirname(pkgJson), 'bin', 'tsc')
  } catch {
    fail('typescript is not installed (devDependency); cannot build')
  }
  if (!existsSync(tscPath)) fail(`typescript has no bin/tsc at ${tscPath}`)
  const result = spawnSync(process.execPath, [tscPath, '-p', join(PKG, 'tsconfig.build.json')], {
    cwd: PKG,
    stdio: 'inherit',
  })
  if (result.error) fail(`tsc spawn failed: ${result.error.message}`)
  if (result.status !== 0) fail(`tsc exited ${result.status}`)
}

function nonImportLiterals(source) {
  const found = []
  for (const line of source.split('\n')) {
    // Only path-computation call sites count: generated-output template
    // strings (package.json types legs, sheet pins) carry .d.ts legs that
    // are payload, not resolution, and must not trip the assertion.
    if (!/(neoFilePath|runtimeModulePath|resolve)\(/.test(line)) continue
    const code = line.split('//')[0]
    for (const match of code.matchAll(/['"]([\w.-]+\.tsx?|[\w.-]+\.d\.mts)['"]/g)) {
      found.push(match[1])
    }
  }
  return found.sort()
}

function assertLiteralSet() {
  for (const [rel, expected] of PATH_LITERAL_SOURCES) {
    const actual = nonImportLiterals(readFileSync(join(PKG, rel), 'utf8'))
    const want = [...expected].sort()
    if (JSON.stringify(actual) !== JSON.stringify(want)) {
      fail(
        `path-literal drift in ${rel}: found [${actual.join(', ')}], expected [${want.join(', ')}]. ` +
          'Update TWINS in tools/build-bin.mjs to match.'
      )
    }
  }
}

function layTwinsAndAssets() {
  for (const [from, to] of [...TWINS, ...ASSETS]) {
    // Twins are transpiled emit (DIST-side); assets are verbatim source
    // copies (PKG-side) — tsc never emits the .d.mts input or the shelf
    // JSON, so a DIST-side read would miss and fail the build.
    const src =
      from.endsWith('.d.mts') || from.endsWith('.json') ? join(PKG, from) : join(DIST, from)
    const dest = join(DIST, to)
    if (!existsSync(src)) fail(`missing build input ${src}`)
    // Shelf rows land under dirs tsc never emits (no .ts beside the
    // JSON), so the parent may not exist yet — create it, never fail.
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(src, dest)
  }
}

function finishBin() {
  const bin = join(DIST, 'bin', 'ref.js')
  if (!existsSync(bin)) fail('missing dist/bin/ref.js after emit')
  const firstLine = readFileSync(bin, 'utf8').split('\n')[0]
  if (!firstLine.startsWith('#!')) fail('dist/bin/ref.js lost its shebang')
  chmodSync(bin, 0o755)
}

function countFiles(dir) {
  let count = 0
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    count += statSync(path).isDirectory() ? countFiles(path) : 1
  }
  return count
}

// Wipe dist first: without a clean step, deleted sources linger as dead
// emit beside fresh output and ship in the tarball.
rmSync(DIST, { force: true, recursive: true })
runTsc()
assertLiteralSet()
layTwinsAndAssets()
finishBin()
console.log(`[ref build] dist ready: ${countFiles(DIST)} files, bin dist/bin/ref.js`)
