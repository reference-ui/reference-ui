// package-shape.spec.ts — spec for NEO-REF-01, the generated types package port. Takes { case } with the
// world freshly synced and the background manifest awaited explicitly. Emits nothing on success; throws naming
// the first package key, link, or export that drifts from the matrix oracle on failure.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { NeoCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { waitForReferenceReady } from '../../shared/ref-world.ts'

interface SpecInput {
  page: SpecPage
  case: NeoCase
}

interface TypesModule {
  Reference?: unknown
}

interface ManifestModule {
  default?: unknown
  manifest?: unknown
}

interface TypesPackageJson {
  name?: unknown
  main?: unknown
  types?: unknown
  exports?: unknown
}

// Matrix unit test 6: the sync emits the generated @reference-ui/types package with runtime + manifest legs.
export default async function run({ case: c }: SpecInput): Promise<void> {
  await waitForReferenceReady(c.worldDir)
  const typesDir = path.join(c.worldDir, '.reference-ui', 'types')
  const packageJsonPath = path.join(typesDir, 'package.json')
  assert.ok(fs.existsSync(typesDir), '.reference-ui/types exists')
  assert.ok(fs.existsSync(packageJsonPath), 'types package.json exists')

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as TypesPackageJson
  assert.equal(pkg.name, '@reference-ui/types')
  assert.equal(pkg.main, './types.mjs')
  assert.equal(pkg.types, './types.d.mts')
  assert.deepEqual(pkg.exports, {
    '.': { import: './types.mjs', types: './types.d.mts' },
    './manifest': { import: './tasty/manifest.js', types: './tasty/manifest.d.ts' },
    './runtime': { import: './tasty/runtime.js', types: './tasty/runtime.d.ts' },
  })

  for (const file of ['types.mjs', 'types.d.mts', 'tasty/manifest.js', 'tasty/runtime.js']) {
    assert.ok(fs.existsSync(path.join(typesDir, file)), `types package carries ${file}`)
  }
  const decl = fs.readFileSync(path.join(typesDir, 'types.d.mts'), 'utf8')
  assert.ok(decl.includes('Reference'), 'types.d.mts declares the Reference surface')

  const installed = path.join(c.worldDir, 'node_modules', '@reference-ui', 'types')
  assert.ok(fs.existsSync(installed), 'consumer node_modules links @reference-ui/types')
  assert.ok(fs.lstatSync(installed).isSymbolicLink(), 'the types link is a symlink')
  assert.equal(fs.realpathSync(installed), fs.realpathSync(typesDir), 'the link lands on the package')

  const generated = (await import(pathToFileURL(path.join(typesDir, 'types.mjs')).href)) as TypesModule
  assert.equal(typeof generated.Reference, 'function', 'types.mjs exports the Reference component')
  const manifestModule = (await import(
    pathToFileURL(path.join(typesDir, 'tasty', 'manifest.js')).href
  )) as ManifestModule
  assert.deepEqual(manifestModule.default, manifestModule.manifest, 'manifest default matches the named export')
}
