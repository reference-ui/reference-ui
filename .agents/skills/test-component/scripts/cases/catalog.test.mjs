import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Writable } from 'node:stream'
import { test } from 'node:test'
import { discoverSource, discoverTests, titlePattern, exportedComponents } from './discover.mjs'
import { loadCatalog, selectCase, searchCases } from './catalog.mjs'
import { evidenceErrors } from './results.mjs'
import { ctFileTarget, unitDirectory, artifactsDirectory } from './targets.mjs'
import { resolveSelection, selectByGrep, selectLegacyTarget, executionSelector, executionArguments } from './selection.mjs'
import { parseCatalogInvocation, formatCatalogJson, formatCatalogHuman, listingExitCode, writeCatalogOutput } from './output.mjs'

function caseEntry(overrides = {}) {
  const component = overrides.component || 'Widget'
  const file = overrides.file || 'Widget.test.ts'
  return {
    id: 'LIB-WIDGET-001', name: 'case', kind: 'unit', component, file, line: 1,
    title: 'Widget case', parameterized: false, rows: 1, rowTitles: null,
    absoluteFile: `/repo/src/components/${component}/${file}`, ...overrides,
  }
}

const SOURCE = `// A leading comment and non-ASCII title must preserve source offsets.
import { describe, it, expect } from 'vitest'
describe('Widget Ω', () => {
  it('keeps the native contract', () => { expect(true).toBe(true) })
  it.each(['first', 'second'] as const)('accepts %s', value => { expect(value).toBeTruthy() })
})`

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ref-component-catalog-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const dir = path.join(root, 'src/components/Widget')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(root, 'src/index.ts'), "export * from './components/Widget/index'\n")
  const file = path.join(dir, 'Widget.test.ts')
  fs.writeFileSync(file, SOURCE)
  const manifest = {
    schemaVersion: 1, component: 'Widget', scope: 'public', description: 'Native widget and row contracts.',
    cases: discoverTests(file).map((entry, index) => ({
      id: `LIB-WIDGET-${String(index + 1).padStart(3, '0')}`, name: entry.title,
      kind: entry.kind, file: 'Widget.test.ts', title: entry.title,
    })),
  }
  const save = () => fs.writeFileSync(path.join(dir, 'case.json'), JSON.stringify(manifest))
  save()
  return { root, dir, file, manifest, save }
}

test('discovery preserves UTF-8 line positions across repeated parses and static each rows', () => {
  for (let run = 0; run < 3; run++) {
    const found = discoverSource(SOURCE)
    assert.equal(found[0].line, 4)
    assert.equal(found[1].line, 5)
    assert.equal(found[0].title, 'Widget Ω keeps the native contract')
    assert.equal(found[1].rows, 2)
    assert.match('Widget Ω accepts first', new RegExp(titlePattern(found[1].title, true)))
  }
})

test('discovery resolves named object tables and ignores hook metadata and calls inside tests', () => {
  const found = discoverSource(`const rows = [{ name: 'one' }, { name: 'two' }];
    test.describe('browser', () => { test.use({ locale: 'en' });
      test('works', () => { test.skip(false, 'browser guard'); /test/.test('x') });
      it.each(rows)('accepts $name', () => { expect(true).toBe(true) });
    });`)
  assert.equal(found.length, 2)
  assert.equal(found[1].rows, 2)
})

test('public scope uses real export declarations, not imports, strings, or commented exports', () => {
  assert.deepEqual([...exportedComponents(`// export * from './components/Fake/index'
    const docs = "export * from './components/Example/index'";
    import { Internal } from './components/Internal/index';
    export * from './components/Widget/index';
    export { Utility } from './components/Utility/index';`)], ['Widget', 'Utility'])
})

test('discovery rejects skipped, focused, TODO, empty each, duplicate, and dynamic declarations', () => {
  for (const source of [
    `it.skip('hidden', () => {});`, `describe.only('suite', () => { it('x', () => {}) });`,
    `it.todo('later');`, `it.each([])('empty %s', () => {});`,
    `it('same', () => {}); it('same', () => {});`,
    `for (const title of ['x']) { it(title, () => {}) }`,
    `it('missing callback');`, `it.each(unknown)('row %s', () => {});`,
  ]) assert.throws(() => discoverSource(source))
})

test('catalog indexes every declaration with exact selection and search', t => {
  const { root } = fixture(t)
  const catalog = loadCatalog(root)
  assert.equal(catalog.components.length, 1)
  assert.equal(catalog.cases.length, 2)
  assert.equal(selectCase(catalog, 'LIB-WIDGET-002').rows, 2)
  assert.equal(searchCases(catalog, 'native').length, 1)
  assert.throws(() => selectCase(catalog, 'LIB-NOPE-001'), /Unknown catalog case/)
})

test('catalog fails on missing manifests, missing public directories, and empty public evidence', t => {
  const { root, dir, manifest, save } = fixture(t)
  fs.unlinkSync(path.join(dir, 'case.json'))
  assert.throws(() => loadCatalog(root), /missing component manifest/)
  manifest.cases = []
  save()
  assert.throws(() => loadCatalog(root), /public\/support components must have executable cases/)
  fs.writeFileSync(path.join(root, 'src/index.ts'), "export * from './components/Absent/index'")
  assert.throws(() => loadCatalog(root), /exported component directory Absent is missing/)
})

test('catalog rejects unknown fields, wrong scope, duplicate IDs, and repeated evidence', t => {
  const { root, manifest, save } = fixture(t)
  manifest.scope = 'support'
  manifest.cases[1] = { ...manifest.cases[0], extra: true }
  save()
  assert.throws(() => loadCatalog(root), error => {
    for (const message of ['must have public scope', 'unknown field extra', 'duplicate global case id', 'already indexed']) {
      assert.match(error.message, new RegExp(message))
    }
    return true
  })
})

test('catalog rejects stale titles, unindexed declarations, wrong kinds, and escaped evidence paths', t => {
  const { root, manifest, save } = fixture(t)
  manifest.cases[0].title = 'old title'
  manifest.cases[1].kind = 'ct'
  save()
  assert.throws(() => loadCatalog(root), /stale title/)
  assert.throws(() => loadCatalog(root), /unindexed declaration/)
  assert.throws(() => loadCatalog(root), /kind does not match/)
  manifest.cases[0].file = '../elsewhere.test.ts'
  save()
  assert.throws(() => loadCatalog(root), /contained POSIX path/)
})

test('catalog detects new evidence files and symlinked evidence rather than silently ignoring them', t => {
  const { root, dir } = fixture(t)
  fs.writeFileSync(path.join(dir, 'new.test.ts'), `it('new contract', () => { expect(true).toBe(true) })`)
  assert.throws(() => loadCatalog(root), /unindexed declaration new contract/)
  fs.unlinkSync(path.join(dir, 'new.test.ts'))
  fs.symlinkSync(path.join(dir, 'Widget.test.ts'), path.join(dir, 'alias.test.ts'))
  assert.throws(() => loadCatalog(root), /symlinks cannot be case evidence/)
})

test('execution proof rejects missing, skipped, and partial rows even when the process exits zero', t => {
  const { root } = fixture(t)
  const entry = selectCase(loadCatalog(root), 'LIB-WIDGET-002')
  const row = title => ({ file: entry.absoluteFile, fullTitle: title, status: 'passed' })
  const passing = [row('Widget Ω accepts first'), row('Widget Ω accepts second')]
  assert.deepEqual(evidenceErrors(passing, [entry]), [])
  assert.notEqual(evidenceErrors([], [entry]).length, 0)
  assert.notEqual(evidenceErrors([passing[0]], [entry]).length, 0)
  assert.notEqual(evidenceErrors([passing[0], { ...passing[1], status: 'skipped' }], [entry]).length, 0)
  assert.notEqual(evidenceErrors([{ ...passing[0], react: 'react18' }], [entry], { runtime: 'react19' }).length, 0)
  assert.notEqual(evidenceErrors([], []).length, 0)
})

test('execution proof enforces every selected declaration independently of the report', () => {
  const file = '/repo/src/components/Widget/Widget.test.ts'
  const a = caseEntry({ id: 'LIB-WIDGET-001', title: 'Widget alpha', absoluteFile: file })
  const b = caseEntry({ id: 'LIB-WIDGET-002', title: 'Widget beta', absoluteFile: file })
  const row = (title, status) => ({ file, fullTitle: title, status })
  assert.notEqual(evidenceErrors([row('Widget alpha', 'passed'), row('Widget beta', 'skipped')], [a, b]).length, 0)
  assert.notEqual(evidenceErrors([row('Widget alpha', 'passed')], [a, b]).length, 0)
  assert.deepEqual(evidenceErrors([row('Widget alpha', 'passed'), row('Widget beta', 'passed')], [a, b]), [])
})

test('an excluded sibling that reports as skipped does not fail its selected declaration', () => {
  const file = '/repo/src/components/Widget/Widget.test.ts'
  const a = caseEntry({ id: 'LIB-WIDGET-001', title: 'Widget alpha', absoluteFile: file })
  const sibling = caseEntry({ id: 'LIB-WIDGET-009', title: 'Widget sibling', absoluteFile: file })
  const report = [{ file, fullTitle: 'Widget alpha', status: 'passed' }, { file, fullTitle: 'Widget sibling', status: 'skipped' }]
  assert.deepEqual(evidenceErrors(report, [a]), [])
  assert.notEqual(evidenceErrors(report, [sibling]).length, 0)
})

test('each declaration proof requires its complete static row count and cannot borrow another file', () => {
  const file = '/repo/src/components/Widget/Widget.test.ts'
  const entry = caseEntry({ id: 'LIB-WIDGET-003', title: 'Widget accepts %s', parameterized: true, rows: 2, rowTitles: ['Widget accepts a', 'Widget accepts b'], absoluteFile: file })
  const row = (fullTitle, status = 'passed', fromFile = file) => ({ file: fromFile, fullTitle, status })
  assert.notEqual(evidenceErrors([row('Widget accepts a')], [entry]).length, 0)
  assert.deepEqual(evidenceErrors([row('Widget accepts a'), row('Widget accepts b')], [entry]), [])
  assert.notEqual(evidenceErrors([row('Widget accepts a'), row('Widget accepts b', 'passed', '/repo/src/components/Other/Other.test.ts')], [entry]).length, 0)
})

test('grep selects complete declarations and maps expanded rows back to their declaration', () => {
  const plain = caseEntry({ id: 'LIB-WIDGET-001', title: 'Widget escape closes' })
  const plainTwo = caseEntry({ id: 'LIB-WIDGET-002', title: 'Widget escape restores' })
  const rows = caseEntry({ id: 'LIB-WIDGET-003', title: 'Widget accepts %s', parameterized: true, rows: 2, rowTitles: ['Widget accepts a', 'Widget accepts b'] })
  const cases = [plain, plainTwo, rows]
  assert.deepEqual(selectByGrep(cases, 'escape'), [plain, plainTwo])
  assert.equal(executionSelector([plain, plainTwo]).includes('^Widget escape closes$'), true)
  assert.deepEqual(selectByGrep(cases, 'accepts b'), [rows])
  assert.equal(executionSelector([rows]), '(^(Widget accepts a|Widget accepts b)$)')
  const opaque = caseEntry({ id: 'LIB-WIDGET-004', title: 'Widget value %o', parameterized: true, rows: 1, rowTitles: null })
  assert.equal(executionSelector([opaque]), `(${titlePattern(opaque.title, true)})`)
  assert.throws(() => selectByGrep(cases, 'nothing-here'))
  assert.throws(() => selectByGrep(cases, '('))
})

test('grep fails explicitly when a parameterized declaration has no static row identities', () => {
  const opaque = caseEntry({ id: 'LIB-WIDGET-004', title: 'Widget value %o', parameterized: true, rows: 1, rowTitles: null })
  assert.throws(() => selectByGrep([opaque], 'value'), error => /LIB-WIDGET-004/.test(error.message) && /catalog case ID/i.test(error.message))
})

test('legacy line and expanded-row title targets map to one declaration and reject zero or ambiguous matches', () => {
  const a = caseEntry({ id: 'LIB-WIDGET-001', title: 'Widget alpha', line: 5, name: 'alpha' })
  const b = caseEntry({ id: 'LIB-WIDGET-002', title: 'Widget beta', line: 6, name: 'beta' })
  const rows = caseEntry({ id: 'LIB-WIDGET-003', title: 'Widget accepts %s', parameterized: true, rows: 2, rowTitles: ['Widget accepts a', 'Widget accepts b'], line: 9 })
  const cases = [a, b, rows]
  assert.deepEqual(selectLegacyTarget(cases, { line: 5 }), [a])
  assert.deepEqual(selectLegacyTarget(cases, { id: 'Widget accepts b' }), [rows])
  assert.deepEqual(selectLegacyTarget(cases, { id: 'alpha' }), [a])
  assert.throws(() => selectLegacyTarget(cases, { line: 99 }))
  assert.throws(() => selectLegacyTarget(cases, { id: 'Widget' }))
  assert.throws(() => selectLegacyTarget([a, { ...b, line: 5 }], { line: 5 }))
})

test('legacy selection narrows the expected set and grep adds complete declaration rows', () => {
  const catalog = { cases: [
    caseEntry({ id: 'LIB-WIDGET-001', title: 'Widget alpha', line: 5, name: 'alpha' }),
    caseEntry({ id: 'LIB-WIDGET-002', title: 'Widget beta', line: 6, name: 'beta' }),
  ] }
  const legacy = resolveSelection(catalog, { component: 'Widget', targetId: 'alpha' })
  assert.equal(legacy.mode, 'legacy')
  assert.deepEqual(legacy.cases.map(entry => entry.id), ['LIB-WIDGET-001'])
  const grep = resolveSelection(catalog, { component: 'Widget', grep: 'beta' })
  assert.deepEqual(grep.cases.map(entry => entry.id), ['LIB-WIDGET-002'])
  assert.notEqual(grep.selector, '')
  const all = resolveSelection(catalog, { component: 'Widget' })
  assert.equal(all.mode, 'component')
  assert.equal(all.cases.length, 2)
})

test('catalog JSON output is one parseable value with stable fields and no human trailer', t => {
  const { root } = fixture(t)
  const catalog = loadCatalog(root)
  const text = formatCatalogJson(searchCases(catalog, 'accepts'))
  const parsed = JSON.parse(text)
  assert.equal(parsed.length, 1)
  for (const key of ['id', 'name', 'component', 'kind', 'file', 'line', 'title', 'parameterized', 'rows']) {
    assert.equal(key in parsed[0], true, key)
  }
  assert.equal(parsed[0].parameterized, true)
  assert.equal(parsed[0].rows, 2)
  assert.equal(text.includes('registered cases'), false)
  assert.equal(formatCatalogJson([]), '[]')
  assert.equal(formatCatalogHuman([]), '')
})

test('large catalog output completes under stdout backpressure before the caller can exit', async () => {
  const entries = Array.from({ length: 400 }, (_, index) => caseEntry({ id: `LIB-WIDGET-${index}`, title: 'Widget large listing '.repeat(10) }))
  const chunks = []
  const stream = new Writable({ highWaterMark: 1, write(chunk, encoding, callback) {
    setImmediate(() => { chunks.push(chunk); callback() })
  } })
  const output = formatCatalogJson(entries)
  assert.ok(Buffer.byteLength(output) > 65536)
  const writing = writeCatalogOutput(stream, output)
  assert.equal(chunks.length, 0)
  await writing
  assert.equal(JSON.parse(Buffer.concat(chunks).toString()).length, entries.length)
  stream.end()
})

test('catalog invocations accept positional and flag search aliases and reject missing values', () => {
  assert.deepEqual(parseCatalogInvocation(['list', '--json']), { command: 'list', query: '', selector: '', json: true, list: false })
  assert.equal(parseCatalogInvocation(['search', 'focus']).query, 'focus')
  assert.equal(parseCatalogInvocation(['search', 'focus']).command, 'search')
  assert.equal(parseCatalogInvocation(['--search', 'focus', '--json']).command, 'search')
  assert.equal(parseCatalogInvocation(['--search', 'focus']).query, 'focus')
  assert.equal(parseCatalogInvocation(['run', 'LIB-WIDGET-001']).selector, 'LIB-WIDGET-001')
  assert.throws(() => parseCatalogInvocation(['search']))
  assert.throws(() => parseCatalogInvocation(['--search']))
  assert.throws(() => parseCatalogInvocation(['run']))
  assert.equal(listingExitCode('search', 0), 1)
  assert.equal(listingExitCode('search', 3), 0)
  assert.equal(listingExitCode('list', 0), 0)
})

test('imported aliases and computed modifiers fail closed beside recognized evidence', () => {
  assert.throws(() => discoverSource(`import { it, it as caseTest } from 'vitest'
    it('indexed', () => {})
    caseTest.skip('hidden', () => {})`))
  assert.throws(() => discoverSource(`import { it } from 'vitest'
    it('indexed', () => {})
    it['skip']('hidden', () => {})`))
  assert.throws(() => discoverSource(`import { it } from 'vitest'
    it('indexed', () => {})
    it['wat']('hidden', () => {})`))
  const runnable = discoverSource(`import { it as caseTest } from 'vitest'
    caseTest('runs', () => {})`)
  assert.equal(runnable.length, 1)
  assert.equal(runnable[0].title, 'runs')
})

test('aliased suites keep their title and unsupported tagged each fails explicitly', () => {
  const found = discoverSource(`import { describe as suite, it } from 'vitest'
    suite('group', () => { it('x', () => {}) })`)
  assert.equal(found[0].title, 'group x')
  assert.throws(() => discoverSource(`import { it } from 'vitest'
    it('indexed', () => {})
    it.each(['a'])\`accepts %s\``))
})

test('runtime skips inside a callback stay execution evidence, not declarations', () => {
  const found = discoverSource(`import { it, test } from 'vitest'
    it('works', () => { test.skip(false, 'guard'); /x/.test('x') })`)
  assert.equal(found.length, 1)
  assert.equal(found[0].title, 'works')
})

test('static each tables resolve at the declaration scope without leaking sibling or test-body bindings', () => {
  const found = discoverSource(`const rows = ['a', 'b'] as const
    describe('outer', () => { it.each(rows)('accepts %s', () => {}) })
    describe('other', () => {
      const rows = ['c'] as const
      it.each(rows)('accepts %s', () => {})
    })
    it('ordinary', () => { const rows = ['unrelated'] })`)
  assert.equal(found[0].rows, 2)
  assert.equal(found[1].rows, 1)
})

test('a supported local table shadows an outer table without disappearing', () => {
  const found = discoverSource(`const rows = ['a', 'b'] as const
    describe('outer', () => {
      const rows = ['c'] as const
      it.each(rows)('accepts %s', () => {})
    })`)
  assert.equal(found[0].rows, 1)
})

test('empty parameter expansions produce matchable row titles and complete row proof', () => {
  const percent = discoverSource(`import { it } from 'vitest'
    it.each(['', 'x'])('accepts %s', () => {})`)
  assert.equal(percent[0].rows, 2)
  assert.deepEqual(percent[0].rowTitles, ['accepts ', 'accepts x'])
  assert.match('accepts ', new RegExp(titlePattern(percent[0].title, true)))
  const file = '/repo/src/components/Widget/Widget.test.ts'
  const entry = { ...percent[0], absoluteFile: file }
  assert.deepEqual(evidenceErrors([{ file, fullTitle: 'accepts ', status: 'passed' }, { file, fullTitle: 'accepts x', status: 'passed' }], [entry]), [])

  const named = discoverSource(`import { it } from 'vitest'
    it.each([{ name: '' }])('accepts $name', () => {})`)
  assert.deepEqual(named[0].rowTitles, ["accepts ''"])
  assert.match("accepts ''", new RegExp(titlePattern(named[0].title, true)))
  assert.throws(() => discoverSource(`import { it } from 'vitest'
    const a = b
    const b = a
    it.each(a)('accepts %s', () => {})`))
})


test('Field and Reference selectors do not run longer sibling component names', () => {
  for (const [component, sibling] of [['Field', 'NumberField'], ['Reference', 'ReferenceLibrary']]) {
    const own = `/repo/src/components/${component}/${component}.test.tsx`
    const other = `/repo/src/components/${sibling}/${sibling}.test.tsx`
    assert.equal(own.includes(unitDirectory(component)), true)
    assert.equal(other.includes(unitDirectory(component)), false)
    const file = `/repo/src/components/${component}/__e2e__/${component}.ct.spec.ts`
    const pattern = new RegExp(ctFileTarget(file))
    assert.equal(pattern.test(file), true)
    assert.equal(pattern.test(file.replaceAll(component, sibling)), false)
    assert.equal(pattern.test(`${file}.old`), false)
    assert.equal(ctFileTarget(file, 17).endsWith('$:17'), true)
  }
})

test('parallel jobs and React runtime legs cannot clear each other\'s artifact directories', () => {
  const left = artifactsDirectory('/repo/playwright', 101, 'react19')
  const right = artifactsDirectory('/repo/playwright', 102, 'react19')
  const otherRuntime = artifactsDirectory('/repo/playwright', 101, 'react18')
  assert.notEqual(left, right)
  assert.notEqual(left, otherRuntime)
  assert.equal(left.startsWith(`${right}/`), false)
  assert.equal(right.startsWith(`${left}/`), false)
  assert.equal(otherRuntime.startsWith(`${left}/`), false)
})

test('execution arguments target CT declarations by exact file line, never a Vitest title grep', () => {
  const file = '/repo/src/components/Widget/__e2e__/Widget.ct.spec.ts'
  const first = caseEntry({ id: 'LIB-WIDGET-001', kind: 'ct', file: '__e2e__/Widget.ct.spec.ts', title: 'Widget browser a', line: 5, absoluteFile: file })
  const second = caseEntry({ id: 'LIB-WIDGET-002', kind: 'ct', file: '__e2e__/Widget.ct.spec.ts', title: 'Widget browser b', line: 9, absoluteFile: file })
  const unit = caseEntry({ id: 'LIB-WIDGET-003', kind: 'unit', title: 'Widget unit c', line: 3 })
  const plan = executionArguments([first, second, unit])
  assert.deepEqual(plan.ctTargets, [ctFileTarget(file, 5), ctFileTarget(file, 9)])
  assert.equal(plan.ctTargets.every(target => target.endsWith(':5') || target.endsWith(':9')), true)
  assert.equal(plan.ctTargets.includes(plan.unitSelector), false)
  assert.match(plan.unitSelector, /Widget unit c/)
  assert.equal(new RegExp(ctFileTarget(file, 5)).test('/repo/src/components/WidgetExtra/__e2e__/WidgetExtra.ct.spec.ts'), false)
})

test('grep across components resolves each CT declaration to its own file line', () => {
  const a = caseEntry({ id: 'LIB-WIDGET-001', component: 'Widget', kind: 'ct', file: '__e2e__/Widget.ct.spec.ts', title: 'Widget browser escape', line: 4, absoluteFile: '/repo/src/components/Widget/__e2e__/Widget.ct.spec.ts' })
  const b = caseEntry({ id: 'LIB-GADGET-001', component: 'Gadget', kind: 'ct', file: '__e2e__/Gadget.ct.spec.ts', title: 'Gadget browser escape', line: 7, absoluteFile: '/repo/src/components/Gadget/__e2e__/Gadget.ct.spec.ts' })
  const plan = executionArguments(selectByGrep([a, b], 'escape'))
  assert.deepEqual(plan.ctTargets, [ctFileTarget(a.absoluteFile, 4), ctFileTarget(b.absoluteFile, 7)])
  assert.equal(plan.unitSelector, '')
})

test('broad runs omit title arguments and collapse only completely selected CT files', () => {
  const file = '/repo/src/components/Widget/__e2e__/Widget.ct.spec.ts'
  const first = caseEntry({ id: 'LIB-WIDGET-001', kind: 'ct', absoluteFile: file, line: 5 })
  const second = caseEntry({ id: 'LIB-WIDGET-002', kind: 'ct', absoluteFile: file, line: 9 })
  const unit = caseEntry({ id: 'LIB-WIDGET-003', title: `Widget ${'long '.repeat(30000)}` })
  const catalogCases = [first, second, unit]
  const all = executionArguments(catalogCases, { filtered: false, catalogCases })
  assert.equal(all.unitSelector, '')
  assert.deepEqual(all.ctTargets, [ctFileTarget(file)])
  const incomplete = executionArguments([first, unit], { filtered: false, catalogCases })
  assert.deepEqual(incomplete.ctTargets, [ctFileTarget(file, 5)])
  const filtered = executionArguments([first, second], { filtered: true, catalogCases })
  assert.deepEqual(filtered.ctTargets, [ctFileTarget(file, 5), ctFileTarget(file, 9)])
})

test('a selected each CT declaration stays one file line target for all of its rows', () => {
  const file = '/repo/src/components/Widget/__e2e__/Widget.ct.spec.ts'
  const rows = caseEntry({ id: 'LIB-WIDGET-004', kind: 'ct', file: '__e2e__/Widget.ct.spec.ts', title: 'Widget browser accepts %s', parameterized: true, rows: 3, rowTitles: ['Widget browser accepts a', 'Widget browser accepts b', 'Widget browser accepts c'], line: 12, absoluteFile: file })
  const plan = executionArguments([rows])
  assert.deepEqual(plan.ctTargets, [ctFileTarget(file, 12)])
})

test('the runner hands Playwright file line targets instead of a Vitest title grep', () => {
  const runnerPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'test-component.mjs')
  const runner = fs.readFileSync(runnerPath, 'utf8')
  assert.match(runner, /executionArguments/)
  assert.match(runner, /pwArgs\.push\(\.\.\.ctTargets\)/)
  assert.equal(/pwArgs\.push\(['"]-g['"]/.test(runner), false)
})

test('grep rejects a hidden opaque declaration even when another declaration matches', () => {
  const known = caseEntry({ id: 'LIB-WIDGET-001', title: 'Widget alpha' })
  const opaque = caseEntry({ id: 'LIB-WIDGET-002', title: 'Widget value %o', parameterized: true, rows: 1, rowTitles: null })
  assert.throws(() => selectByGrep([known, opaque], 'alpha'), error => /LIB-WIDGET-002/.test(error.message) && /catalog case ID/i.test(error.message))
})

test('requested layers bound the grep universe so CT opacity cannot block a unit selection', () => {
  const catalog = { cases: [
    caseEntry({ id: 'LIB-WIDGET-001', kind: 'unit', title: 'Widget alpha' }),
    caseEntry({ id: 'LIB-WIDGET-002', kind: 'ct', file: '__e2e__/Widget.ct.spec.ts', title: 'Widget value %o', parameterized: true, rows: 1, rowTitles: null, absoluteFile: '/repo/src/components/Widget/__e2e__/Widget.ct.spec.ts' }),
  ] }
  const unit = resolveSelection(catalog, { component: 'Widget', grep: 'alpha', kinds: ['unit'] })
  assert.deepEqual(unit.cases.map(entry => entry.id), ['LIB-WIDGET-001'])
  assert.throws(() => resolveSelection(catalog, { component: 'Widget', grep: 'alpha' }))
  assert.throws(() => resolveSelection(catalog, { component: 'Widget', grep: 'value', kinds: ['ct'] }))
})

test('legacy row identity for an opaque declaration points at the catalog ID', () => {
  const opaque = caseEntry({ id: 'LIB-WIDGET-004', title: 'Widget value %o', parameterized: true, rows: 1, rowTitles: null })
  assert.throws(() => selectLegacyTarget([opaque], { id: 'value' }), error => /LIB-WIDGET-004/.test(error.message) && /catalog case ID/i.test(error.message))
  assert.deepEqual(selectLegacyTarget([opaque], { id: 'LIB-WIDGET-004' }), [opaque])
})

test('known row titles require their exact multiset, not just a matching count', () => {
  const file = '/repo/src/components/Widget/Widget.test.ts'
  const entry = caseEntry({ id: 'LIB-WIDGET-003', title: 'Widget accepts %s', parameterized: true, rows: 2, rowTitles: ['Widget accepts a', 'Widget accepts b'], absoluteFile: file })
  const row = fullTitle => ({ file, fullTitle, status: 'passed' })
  assert.deepEqual(evidenceErrors([row('Widget accepts a'), row('Widget accepts b')], [entry]), [])
  assert.notEqual(evidenceErrors([row('Widget accepts a'), row('Widget accepts a')], [entry]).length, 0)
  assert.notEqual(evidenceErrors([row('Widget accepts a'), row('Widget accepts c')], [entry]).length, 0)
})

test('duplicate expected row titles require exactly that multiplicity', () => {
  const file = '/repo/src/components/Widget/Widget.test.ts'
  const entry = caseEntry({ id: 'LIB-WIDGET-005', title: 'Widget twirls %s', parameterized: true, rows: 2, rowTitles: ['Widget twirls x', 'Widget twirls x'], absoluteFile: file })
  const row = fullTitle => ({ file, fullTitle, status: 'passed' })
  assert.deepEqual(evidenceErrors([row('Widget twirls x'), row('Widget twirls x')], [entry]), [])
  assert.notEqual(evidenceErrors([row('Widget twirls x')], [entry]).length, 0)
  assert.notEqual(evidenceErrors([row('Widget twirls x'), row('Widget twirls x'), row('Widget twirls x')], [entry]).length, 0)
})

test('exact known rows cannot be satisfied from another file or runtime', () => {
  const file = '/repo/src/components/Widget/Widget.test.ts'
  const entry = caseEntry({ id: 'LIB-WIDGET-006', title: 'Widget accepts %s', parameterized: true, rows: 2, rowTitles: ['Widget accepts a', 'Widget accepts b'], absoluteFile: file })
  const row = (fullTitle, from = file, react) => ({ file: from, fullTitle, status: 'passed', react })
  assert.notEqual(evidenceErrors([row('Widget accepts a'), row('Widget accepts b', '/repo/src/components/Other/Other.test.ts')], [entry]).length, 0)
  assert.notEqual(evidenceErrors([row('Widget accepts a', file, 'react18'), row('Widget accepts b', file, 'react18')], [entry], { runtime: 'react19' }).length, 0)
})

test('known row titles are matched literally, including suite $name and %s tokens', () => {
  const file = '/repo/src/components/Widget/Widget.test.ts'
  const entry = caseEntry({ id: 'LIB-WIDGET-007', title: 'Widget $name suite accepts %s', parameterized: true, rows: 1, rowTitles: ['Widget $name suite accepts a'], absoluteFile: file })
  const row = fullTitle => ({ file, fullTitle, status: 'passed' })
  assert.deepEqual(evidenceErrors([row('Widget $name suite accepts a')], [entry]), [])
  assert.notEqual(evidenceErrors([row('Widget real suite accepts a')], [entry]).length, 0)
})

test('aggregated vitest bindings fail closed instead of silently dropping declarations', () => {
  const sources = [
    `import { it } from 'vitest'
     const wrapper = { spec: it }
     it('indexed', () => {})
     wrapper.spec.skip('hidden', () => {})`,
    `import { it } from 'vitest'
     const wrapper = { spec: it }
     wrapper.spec('visible', () => {})`,
    `import { it } from 'vitest'
     const wrappers = [it]
     wrappers[0]('hidden', () => {})`,
    `import { it } from 'vitest'
     const wrapper = { it }
     wrapper.it('shorthand', () => {})`,
    `import { it } from 'vitest'
     const wrapper = { spec: it } as const
     it('indexed', () => {})
     wrapper.spec.skip('hidden', () => {})`,
    `import { it } from 'vitest'
     const wrapper = { spec: it } satisfies Record<string, unknown>
     it('indexed', () => {})
     wrapper.spec.only('hidden', () => {})`,
    `import { it } from 'vitest'
     const wrappers = [it] as const
     it('indexed', () => {})
     wrappers[0].skip('hidden', () => {})`,
  ]
  for (const source of sources) assert.throws(() => discoverSource(source))
})

test('unrelated object bindings are not mistaken for framework aliases', () => {
  const found = discoverSource(`import { it } from 'vitest'
    const settings = { test: 'text', helper: () => {} }
    settings.test
    const config = { mode: 'fast' }
    config.mode
    it('real', () => {})`)
  assert.equal(found.length, 1)
  assert.equal(found[0].title, 'real')
})

test('reproduced table-mutation and framework-alias sources reject instead of accepting partial evidence', () => {
  assert.throws(() => discoverSource(`import { it } from 'vitest'
const rows = ['a']
rows.push('b')
it.each(rows)('accepts %s', () => {})`), /each table .*mutated|escape/i)

  assert.throws(() => discoverSource(`import { it } from 'vitest'
it('indexed', () => {})
const { spec } = { spec: it }
spec.skip('hidden', () => {})`), /unsupported framework/i)

  assert.throws(() => discoverSource(`import { it } from 'vitest'
it('indexed', () => {})
const spec = true ? it : it
spec.only('hidden', () => {})`), /unsupported|framework/i)
})

test('mutated, aliased-mutated, element-assigned, updated, and escaped tables reject while immutable tables keep exact rows', () => {
  const rejects = [
    `import { it } from 'vitest'
const rows = ['a']
const alias = rows
alias.push('b')
it.each(rows)('accepts %s', () => {})`,
    `import { it } from 'vitest'
const rows = ['a', 'b']
rows[0] = 'c'
it.each(rows)('accepts %s', () => {})`,
    `import { it } from 'vitest'
const rows = ['a', 'b']
rows[0]++
it.each(rows)('accepts %s', () => {})`,
    `import { it } from 'vitest'
const rows = ['a', 'b']
unknownFunction(rows)
it.each(rows)('accepts %s', () => {})`,
  ]
  for (const source of rejects) assert.throws(() => discoverSource(source), /immutable|mutat|escape/i)

  const direct = discoverSource(`import { it } from 'vitest'
    it.each(['a', 'b'])('accepts %s', () => {})`)
  assert.deepEqual(direct[0].rowTitles, ['accepts a', 'accepts b'])

  const named = discoverSource(`import { it } from 'vitest'
    const rows = ['a', 'b']
    it.each(rows)('accepts %s', () => {})`)
  assert.equal(named[0].rows, 2)

  const aliased = discoverSource(`import { it } from 'vitest'
    const rows = ['a', 'b']
    const alias = rows
    it.each(alias)('accepts %s', () => {})`)
  assert.equal(aliased[0].rows, 2)

  const reused = discoverSource(`import { it } from 'vitest'
    const rows = ['a', 'b']
    it.each(rows)('first %s', () => {})
    it.each(rows)('second %s', () => {})`)
  assert.equal(reused[0].rows, 2)
  assert.equal(reused[1].rows, 2)
})

test('nested shadowed table mutations and unrelated local arrays do not poison an outer immutable table', () => {
  const found = discoverSource(`import { it } from 'vitest'
const rows = ['a', 'b']
describe('outer', () => {
  const rows = ['c']
  rows.push('d')
  it('inner uses the shadow', () => { expect(rows).toHaveLength(1) })
})
it.each(rows)('outer %s', () => {})`)
  assert.equal(found[1].rows, 2)

  const nested = discoverSource(`import { it } from 'vitest'
const rows = ['a', 'b']
it('plain', () => { const local = ['x']; local.push('y') })
it.each(rows)('outer %s', () => {})`)
  assert.equal(nested[1].rows, 2)
})

test('foreign each, unknown method receivers, and aggregate escapes reject while safe tables keep exact rows', () => {
  const rejects = [
    // Only the framework `.each` identity is trusted; a foreign `.each(rows)` escapes its argument.
    `import { it } from 'vitest'
const rows = ['a']
external.each(rows)
it.each(rows)('accepts %s', () => {})`,
    // A computed or unknown method receiver may mutate or leak the array it holds.
    `import { it } from 'vitest'
const rows = ['a']
rows[method]('b')
it.each(rows)('accepts %s', () => {})`,
    `import { it } from 'vitest'
const rows = ['a']
rows.custom()
it.each(rows)('accepts %s', () => {})`,
    // Shorthand, keyed, spread, nested, and aliased aggregates propagate taint to the captured table.
    `import { it } from 'vitest'
const rows = ['a']
unknownFunction({ rows })
it.each(rows)('accepts %s', () => {})`,
    `import { it } from 'vitest'
const rows = ['a']
const box = { rows }
mutate(box)
it.each(rows)('accepts %s', () => {})`,
    `import { it } from 'vitest'
const rows = ['a']
const box = { rows }
box.rows.push('b')
it.each(rows)('accepts %s', () => {})`,
    `import { it } from 'vitest'
const rows = ['a']
const box = { key: rows }
mutate(box)
it.each(rows)('accepts %s', () => {})`,
    `import { it } from 'vitest'
const rows = ['a']
const box = { nested: { rows } }
mutate(box)
it.each(rows)('accepts %s', () => {})`,
    `import { it } from 'vitest'
const rows = ['a']
const box = { ...rows }
mutate(box)
it.each(rows)('accepts %s', () => {})`,
    `import { it } from 'vitest'
const rows = ['a']
const box = [rows]
const alias = box
mutate(alias)
it.each(rows)('accepts %s', () => {})`,
  ]
  for (const source of rejects) assert.throws(() => discoverSource(source), /immutable|mutat|escape/i)

  const direct = discoverSource(`import { it } from 'vitest'
    it.each(['a', 'b'])('accepts %s', () => {})`)
  assert.equal(direct[0].rows, 2)

  const imported = discoverSource(`import { it as caseTest } from 'vitest'
    caseTest.each(['a', 'b'])('accepts %s', () => {})`)
  assert.equal(imported[0].rows, 2)

  const aliasedReceiver = discoverSource(`import { it } from 'vitest'
    const spec = it
    const rows = ['a', 'b']
    spec.each(rows)('accepts %s', () => {})`)
  assert.equal(aliasedReceiver[0].rows, 2)

  const aliasedTable = discoverSource(`import { it } from 'vitest'
    const rows = ['a', 'b']
    const alias = rows
    it.each(alias)('accepts %s', () => {})`)
  assert.equal(aliasedTable[0].rows, 2)

  const unrelated = discoverSource(`import { it } from 'vitest'
    const rows = ['a', 'b']
    describe('outer', () => {
      const local = { rows: ['c'] }
      local.rows.push('d')
      const box = { local }
      mutate(box)
      it('uses the shadow', () => {})
    })
    it.each(rows)('outer %s', () => {})`)
  assert.equal(unrelated[1].rows, 2)
})

test('inline destructured, conditional, sequence, and logical framework aliases reject beside indexed evidence', () => {
  const sources = [
    `import { it } from 'vitest'
it('indexed', () => {})
const { spec } = { spec: it }
spec.skip('hidden', () => {})`,
    `import { it } from 'vitest'
it('indexed', () => {})
const { spec } = { other: it }
spec.only('hidden', () => {})`,
    `import { it } from 'vitest'
it('indexed', () => {})
const [spec] = [it]
spec.skip('hidden', () => {})`,
    `import { it } from 'vitest'
it('indexed', () => {})
const spec = true ? it : it
spec.skip('hidden', () => {})`,
    `import { it } from 'vitest'
it('indexed', () => {})
const spec = (it, it)
spec.only('hidden', () => {})`,
    `import { it } from 'vitest'
it('indexed', () => {})
const spec = null || it
spec.skip('hidden', () => {})`,
    `import { it } from 'vitest'
it('indexed', () => {})
const spec = it && it
spec.only('hidden', () => {})`,
  ]
  for (const source of sources) assert.throws(() => discoverSource(source), /unsupported|framework/i)
})

test('factory aliases and nested member table escapes reject identifiable framework and table flows', () => {
  assert.throws(() => discoverSource(`import { it } from 'vitest'
it('indexed', () => {})
const spec = wrap(it)
spec.skip('hidden', () => {})`), /unsupported framework alias factory/i)

  for (const statement of [
    'v.expect.each(rows)',
    'const box = { rows }; mutate(box.rows)',
    'const box = true && { rows }; mutate(box)',
    "const box = { rows }; const alias = box.rows; alias.push('b')",
  ]) {
    assert.throws(() => discoverSource(`import { it } from 'vitest'
import * as v from 'vitest'
const rows = ['a']
${statement}
it.each(rows)('accepts %s', () => {})`), /immutable|mutat|escape/i)
  }
  const found = discoverSource(`import * as v from 'vitest'
const rows = ['a', 'b']
v.it.each(rows)('accepts %s', () => {})`)
  assert.deepEqual(found[0].rowTitles, ['accepts a', 'accepts b'])
})

test('unrelated objects, destructuring, conditionals, and locally shadowed framework names remain harmless', () => {
  const found = discoverSource(`import { it } from 'vitest'
    const config = { mode: 'fast', helper: () => {} }
    const { mode } = config
    const choice = true ? 'a' : 'b'
    function spec() { return mode || choice }
    it('real', () => {})`)
  assert.equal(found.length, 1)
  assert.equal(found[0].title, 'real')

  const shadowed = discoverSource(`import { it } from 'vitest'
    it('real', () => {})
    function helper() {
      function it() {}
      const spec = true ? it : it
      spec.skip('not a declaration', () => {})
    }`)
  assert.equal(shadowed.length, 1)
  assert.equal(shadowed[0].title, 'real')
})

test('conformity rejects an unsupported evidence source even when its manifest indexes only the normal declaration', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ref-component-catalog-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const dir = path.join(root, 'src/components/Widget')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(root, 'src/index.ts'), "export * from './components/Widget/index'\n")
  fs.writeFileSync(path.join(dir, 'Widget.test.ts'), `import { describe, it } from 'vitest'
describe('Widget', () => {
  it('keeps the native contract', () => {})
  const rows = ['a']
  rows.push('b')
  it.each(rows)('accepts %s', () => {})
})`)
  fs.writeFileSync(path.join(dir, 'case.json'), JSON.stringify({
    schemaVersion: 1, component: 'Widget', scope: 'public', description: 'Native widget surface.',
    cases: [{ id: 'LIB-WIDGET-001', name: 'keeps', kind: 'unit', file: 'Widget.test.ts', title: 'Widget keeps the native contract' }],
  }))
  assert.throws(() => loadCatalog(root), /immutable|mutat|escape/i)
})
