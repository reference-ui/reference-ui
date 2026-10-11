/**
 * Proves that live component metadata yields individually searchable case IDs.
 * Temporary manifests exercise read errors without relying on the repository's
 * current inventory or treating metadata as a successful test execution.
 */
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { collectComponents } from './components.mjs'
import { search, show } from './lib.mjs'

function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'component-memex-'))
  const components = join(root, 'components')
  const dir = join(components, 'Button')
  mkdirSync(dir, { recursive: true })
  try { run({ root, components, file: join(dir, 'case.json') }) }
  finally { rmSync(root, { recursive: true, force: true }) }
}

const manifest = {
  schemaVersion: 1, component: 'Button', scope: 'support', description: 'Native form submission contracts.',
  cases: [{ id: 'LIB-BUTTON-001', name: 'native submitter', kind: 'ct', file: '__e2e__/Button.ct.spec.ts', title: 'Button native submitter' }],
}

test('component evidence is searchable and its stable ID resolves to a runnable command', () => fixture(({ root, components, file }) => {
  writeFileSync(file, JSON.stringify(manifest))
  const { docs, warnings } = collectComponents(components, root, 'components')
  assert.deepEqual(warnings, [])
  assert.equal(docs.length, 1)
  const all = { docs, manifests: [{ name: 'components', weights: { title: 3 } }], manifest: () => ({ weights: { title: 3 } }) }
  assert.equal(search(all, 'submitter', { collection: 'components' }).hits[0].id, 'LIB-BUTTON-001')
  const resolved = show(all, 'components:LIB-BUTTON-001', { root })
  assert.match(resolved.text, /pnpm agentct run LIB-BUTTON-001/)
  assert.match(resolved.text, /only a completed test run determines pass or failure/)
  writeFileSync(file, JSON.stringify({ ...manifest, scope: 'internal', cases: [] }))
  assert.equal(collectComponents(components, root, 'components').docs.length, 0)
}))

test('invalid or duplicated evidence fails instead of silently disappearing', () => fixture(({ root, components, file }) => {
  writeFileSync(file, JSON.stringify({ ...manifest, cases: [...manifest.cases, ...manifest.cases] }))
  assert.throws(() => collectComponents(components, root, 'components'), /duplicate component case/)
  writeFileSync(file, '{')
  assert.throws(() => collectComponents(components, root, 'components'), SyntaxError)
  writeFileSync(file, JSON.stringify({ ...manifest, component: 'Switch' }))
  assert.throws(() => collectComponents(components, root, 'components'), /Invalid component manifest/)
}))

test('case IDs must be component-owned strings safe to show as commands', () => fixture(({ root, components, file }) => {
  for (const id of [123, {}, [], null, '', ' ', 'LIB-BUTTON-01', 'LIB-SWITCH-001', 'LIB-BUTTON-001; echo invalid', 'LIB-BUTTON-001\n']) {
    writeFileSync(file, JSON.stringify({ ...manifest, cases: [{ ...manifest.cases[0], id }] }))
    assert.throws(() => collectComponents(components, root, 'components'), /Invalid or duplicate component case/)
  }
}))

test('evidence paths must stay relative and inside their component', () => fixture(({ root, components, file }) => {
  for (const evidence of [123, {}, '', '../outside.test.ts', 'nested/../../outside.test.ts', '/outside.test.ts', './inside.test.ts', 'nested//inside.test.ts', 'nested\\inside.test.ts']) {
    writeFileSync(file, JSON.stringify({ ...manifest, cases: [{ ...manifest.cases[0], file: evidence }] }))
    assert.throws(() => collectComponents(components, root, 'components'), /Invalid or duplicate component case/)
  }
}))

test('manifest and case scalar fields follow the catalog metadata schema', () => fixture(({ root, components, file }) => {
  const invalid = [
    null, [], { ...manifest, scope: 'other' }, { ...manifest, description: {} },
    { ...manifest, description: ' ' }, { ...manifest, extra: 'unknown' }, { ...manifest, cases: [] },
  ]
  for (const value of invalid) {
    writeFileSync(file, JSON.stringify(value))
    assert.throws(() => collectComponents(components, root, 'components'), /Invalid component manifest/)
  }
  for (const item of [null, [], { ...manifest.cases[0], name: {} }, { ...manifest.cases[0], title: ' ' }, { ...manifest.cases[0], kind: 'browser' }, { ...manifest.cases[0], extra: 'unknown' }]) {
    writeFileSync(file, JSON.stringify({ ...manifest, cases: [item] }))
    assert.throws(() => collectComponents(components, root, 'components'), /Invalid or duplicate component case/)
  }
}))

test('symlinked component directories fail instead of disappearing', () => fixture(({ root, components, file }) => {
  writeFileSync(file, JSON.stringify(manifest))
  const outside = join(root, 'external-component')
  mkdirSync(outside)
  writeFileSync(join(outside, 'case.json'), JSON.stringify(manifest))
  symlinkSync(outside, join(components, 'LinkedComponent'), 'dir')
  assert.throws(() => collectComponents(components, root, 'components'), /Component directory must not be a symlink/)
}))

test('symlinked manifests fail before their target is read', () => fixture(({ root, components, file }) => {
  const outside = join(root, 'external.json')
  writeFileSync(outside, '{invalid JSON must not be read')
  symlinkSync(outside, file)
  assert.throws(() => collectComponents(components, root, 'components'), /Component manifest must not be a symlink/)
}))
