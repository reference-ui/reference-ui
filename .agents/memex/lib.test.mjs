/**
 * Memex unit tests: pure functions plus tmp-fixture collectors.
 * Run: node --test .agents/memex/lib.test.mjs .agents/memex/components.test.mjs
 * (Node 24 rejects a bare directory argument to --test.)
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  collectMarkdown,
  collectCore,
  collectRs,
  collectRsCases,
  matchGlob,
} from './adapters.mjs'
import { chainShow, extractHeader, readmeChain } from './graph.mjs'
import { buildIndex, loadAll, loadManifests, persistedFor, roster, scopeFor, search, show, UsageError } from './lib.mjs'
import { facetValues, facetsOf, matchesFacets } from './facets.mjs'
import { loadPersistedIndex, writePersistedIndex } from './persist.mjs'
import {
  contentTerms,
  expandQuery,
  extractTitle,
  firstParagraph,
  levenshtein,
  parseFrontmatter,
  parseTags,
  processTerm,
  snippet,
  stem,
  titleSimilarity,
  tokenize,
} from './text.mjs'

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'memex-test-'))
  const done = () => rmSync(dir, { recursive: true, force: true })
  return { dir, done }
}

describe('text', () => {
  it('tokenizes compounds, code, and paths into parts', () => {
    assert.deepEqual(tokenize('data-color-mode `css()` extract/css'), [
      'data',
      'color',
      'mode',
      'css',
      'extract',
      'css',
    ])
  })

  it('stems inflections but passes ids through', () => {
    assert.equal(stem('queries'), 'queri')
    assert.equal(stem('query'), 'queri')
    assert.equal(stem('CORE-CHAIN-01'), 'CORE-CHAIN-01')
  })

  it('drops single-char junk terms', () => {
    assert.equal(processTerm('n'), undefined)
    assert.equal(processTerm('Queries'), 'queri')
  })

  it('parses frontmatter, keeping every flat field', () => {
    const { fields, body } = parseFrontmatter(
      '---\ndate: 2026-01-01\nverdict: "clean-hunt"\ncustom: kept\n---\n# Hi\ntext\n'
    )
    assert.deepEqual(fields, {
      date: '2026-01-01',
      verdict: 'clean-hunt',
      custom: 'kept',
    })
    assert.equal(body, '# Hi\ntext\n')
  })

  it('treats missing frontmatter as bare body', () => {
    const { fields, body } = parseFrontmatter('# Just a doc\n')
    assert.deepEqual(fields, {})
    assert.equal(body, '# Just a doc\n')
  })

  it('normalizes tag shapes', () => {
    assert.deepEqual(parseTags(undefined), [])
    assert.deepEqual(parseTags('[a, b]'), ['a', 'b'])
    assert.deepEqual(parseTags('a, b'), ['a', 'b'])
    assert.deepEqual(parseTags(['a', ' b ']), ['a', 'b'])
  })

  it('extracts the first heading as title', () => {
    assert.equal(extractTitle('intro\n# Real Title\n'), 'Real Title')
    assert.equal(extractTitle('no heading'), null)
  })

  it('snippets prefer the matching line, else the first', () => {
    assert.equal(snippet('alpha\nbravo match\ncharlie', ['match']).text, 'bravo match')
    assert.equal(snippet('alpha\nbravo', ['zzz']).text, 'alpha')
  })

  it('snippets tokenize needles, flag fuzzy variants, and ellipsize', () => {
    assert.equal(snippet('atomic/namer talk', ['atomic/namer']).text, 'atomic/namer talk')
    const fuzzy = snippet('the names table', ['namer'])
    assert.equal(fuzzy.text, 'the names table')
    assert.deepEqual(fuzzy.fuzzy, ['names'])
    const long = snippet(`x ${'y'.repeat(300)}`, ['zzz'])
    assert.ok(long.text.endsWith('…'))
    assert.ok(long.text.length <= 220)
  })

  it('snippet fallback skips headings and excluded lines', () => {
    assert.equal(snippet('## Hypothesis\nreal prose', ['zzz']).text, 'real prose')
    assert.equal(
      snippet('real prose\nsecond line', ['zzz'], new Set(['real prose'])).text,
      'second line'
    )
  })

  it('snippet prefers the line covering the most needles', () => {
    const body = 'namer talk here\nnamer and barrels together\nbarrels alone'
    assert.equal(snippet(body, ['namer', 'barrels']).text, 'namer and barrels together')
  })

  it('snippet ignores junk-short needles', () => {
    assert.equal(snippet('go to it now', ['to']).text, 'go to it now')
    assert.deepEqual(snippet('go to it now', ['to']).fuzzy, [])
  })

  it('levenshtein caps early', () => {
    assert.equal(levenshtein('namer', 'names'), 1)
    assert.equal(levenshtein('namer', 'numeric'), 3)
    assert.equal(levenshtein('a', 'abcdefghij'), 3)
  })

  it('first paragraph skips headings, tables, and fences', () => {
    assert.equal(firstParagraph('# T\n\nProse here.\n\nMore.'), 'Prose here.')
    assert.equal(firstParagraph('# T\n| a |\n'), '')
  })
})

describe('matchGlob', () => {
  it('matches shallow, deep, and exact patterns', () => {
    assert.equal(matchGlob('*.md', 'a.md'), true)
    assert.equal(matchGlob('*.md', 'sub/a.md'), false)
    assert.equal(matchGlob('**/summary.md', 'a/b/summary.md'), true)
    assert.equal(matchGlob('**/summary.md', 'summary.md'), true)
    assert.equal(matchGlob('meta.json', 'meta.json'), true)
    assert.equal(matchGlob('*.md', 'a.txt'), false)
  })
})

describe('markdown collector', () => {
  it('indexes frontmatter, bare docs, and json sidecars', () => {
    const { dir, done } = fixture()
    try {
      writeFileSync(
        join(dir, 'a.md'),
        '---\nmodule: atomic\ntags: [x, y]\n---\n# Title A\nbody words\n'
      )
      writeFileSync(join(dir, 'bare.md'), 'no frontmatter here\n')
      writeFileSync(
        join(dir, 'meta.json'),
        JSON.stringify({ procedure: 'flame/3', n: 7 })
      )
      writeFileSync(join(dir, 'skip.txt'), 'not included\n')
      const manifest = {
        name: 't',
        kind: 'markdown',
        roots: [dir],
        include: ['*.md', '*.json'],
        id: 'basename',
        weights: {},
      }
      const { docs, warnings } = collectMarkdown(dir, manifest)
      assert.equal(warnings.length, 0)
      assert.equal(docs.length, 3)
      const byId = new Map(docs.map(d => [d.id, d]))
      assert.equal(byId.get('a.md').title, 'Title A')
      assert.equal(byId.get('a.md').fields.module, 'atomic')
      assert.equal(byId.get('a.md').fields.tags, 'x y')
      assert.equal(byId.get('a.md').extra, '[atomic]')
      assert.equal(byId.get('bare.md').title, 'bare.md')
      assert.equal(byId.get('meta.json').fields.procedure, 'flame/3')
    } finally {
      done()
    }
  })

  it('uses relative paths for path ids and warns on missing roots', () => {
    const { dir, done } = fixture()
    try {
      mkdirSync(join(dir, 'sub'))
      writeFileSync(join(dir, 'sub', 'a.md'), '# Deep\n')
      const manifest = {
        name: 't',
        kind: 'markdown',
        roots: [dir],
        include: ['**/*.md'],
        id: 'path',
        weights: {},
      }
      const { docs } = collectMarkdown(dir, manifest)
      assert.equal(docs[0].id, 'sub/a.md')
      const missing = collectMarkdown(join(dir, 'nope'), manifest)
      assert.equal(missing.docs.length, 0)
      assert.equal(missing.warnings.length, 1)
    } finally {
      done()
    }
  })
})

describe('core collector', () => {
  it('builds one doc per case dir from meta, readme, and specs', () => {
    const { dir, done } = fixture()
    try {
      const cased = join(dir, 'fam', 'CORE-X-01')
      mkdirSync(join(cased, 'specs'), { recursive: true })
      writeFileSync(
        join(cased, 'case.json'),
        JSON.stringify({ id: 'CORE-X-01', name: 'X one' })
      )
      writeFileSync(join(cased, 'README.md'), '# X\nAbout x.\n')
      writeFileSync(join(cased, 'specs', 'a.spec.ts'), 'test(x)\n')
      mkdirSync(join(cased, 'specs', 'world'))
      writeFileSync(join(cased, 'specs', 'world', 'gen.spec.ts'), 'generated\n')
      writeFileSync(join(dir, 'fam', ' stray.json'), '{}')
      const { docs } = collectCore(join(dir, 'fam'), dir, 'cases')
      assert.equal(docs.length, 1)
      assert.equal(docs[0].id, 'CORE-X-01')
      assert.ok(docs[0].fields.text.includes('test(x)'))
      assert.ok(!docs[0].fields.text.includes('generated'))
      assert.equal(docs[0].payload.specs.length, 1)
    } finally {
      done()
    }
  })
})

describe('rs collector', () => {
  it('builds one doc per module with suite inventory', () => {
    const { dir, done } = fixture()
    try {
      const mod = join(dir, 'mods', 'tiny')
      mkdirSync(join(mod, 'tests', 'cases', 'C1'), { recursive: true })
      writeFileSync(join(mod, 'README.md'), '# Tiny\nDoes tiny things.\n')
      writeFileSync(join(mod, 'tests', 'a.test.ts'), 't\n')
      writeFileSync(
        join(mod, 'tests', 'cases', 'C1', 'f.spec.ts'),
        'fixture, not suite\n'
      )
      const { docs } = collectRs(join(dir, 'mods'), dir, 'surfaces')
      assert.equal(docs.length, 1)
      assert.equal(docs[0].id, 'rs:tiny')
      assert.ok(docs[0].fields.inventory.includes('a.test.ts'))
      assert.ok(!docs[0].fields.inventory.includes('f.spec'))
      assert.ok(docs[0].fields.inventory.includes('C1'))
    } finally {
      done()
    }
  })
})

describe('rs case collector', () => {
  it('builds one doc per case folder from case.json, README, and spec', () => {
    const { dir, done } = fixture()
    try {
      const cased = join(dir, 'mods', 'tiny', 'tests', 'cases', 'TST-AAA-01')
      mkdirSync(cased, { recursive: true })
      writeFileSync(
        join(cased, 'case.json'),
        JSON.stringify({ id: 'TST-AAA-01', name: 'tiny claim' })
      )
      writeFileSync(
        join(cased, 'README.md'),
        '# TST-AAA-01 — tiny claim\nSee TST-AAA-02 and ATL-BAR-01.\n'
      )
      writeFileSync(join(cased, 'spec.ts'), 'export default { id: "TST-AAA-01" }\n')
      const bare = join(dir, 'mods', 'tiny', 'tests', 'cases', 'TST-AAA-02')
      mkdirSync(bare, { recursive: true })
      writeFileSync(join(bare, 'README.md'), '# TST-AAA-02\n')
      const { docs, warnings } = collectRsCases(join(dir, 'mods'), dir, 'rs-cases')
      assert.equal(docs.length, 1)
      assert.equal(docs[0].kind, 'rs-case')
      assert.equal(docs[0].id, 'TST-AAA-01')
      assert.equal(docs[0].title, 'tiny claim')
      assert.equal(docs[0].extra, 'tiny')
      assert.equal(docs[0].path, 'mods/tiny/tests/cases/TST-AAA-01')
      assert.deepEqual(docs[0].payload.related, ['TST-AAA-02', 'ATL-BAR-01'])
      assert.deepEqual(docs[0].payload.specs, [
        'mods/tiny/tests/cases/TST-AAA-01/spec.ts',
      ])
      assert.ok(docs[0].fields.text.includes('export default'))
      assert.deepEqual(warnings, [
        'skipped (no case.json): mods/tiny/tests/cases/TST-AAA-02',
      ])
    } finally {
      done()
    }
  })

  it('warns on a case.json that is unparseable or has no id', () => {
    const { dir, done } = fixture()
    try {
      const cases = join(dir, 'mods', 'tiny', 'tests', 'cases')
      mkdirSync(join(cases, 'TST-BAD-01'), { recursive: true })
      writeFileSync(join(cases, 'TST-BAD-01', 'case.json'), '{"name": "cut off"')
      mkdirSync(join(cases, 'TST-BAD-02'), { recursive: true })
      writeFileSync(join(cases, 'TST-BAD-02', 'case.json'), '{"name": "no id"}')
      const { docs, warnings } = collectRsCases(join(dir, 'mods'), dir, 'rs-cases')
      assert.equal(docs.length, 0)
      assert.deepEqual(warnings, [
        'skipped (unparseable case.json): mods/tiny/tests/cases/TST-BAD-01',
        'skipped (case.json has no id): mods/tiny/tests/cases/TST-BAD-02',
      ])
    } finally {
      done()
    }
  })
})

describe('reference-rs case docs in this repo', () => {
  it('finds a case by its raw id as its own doc, ahead of its module doc', () => {
    const all = loadAll(loadManifests().filter(m => m.name === 'rs-cases'))
    const [top] = search(all, 'ATM-TOKEN-19').hits
    assert.equal(top.collection, 'rs-cases')
    assert.equal(top.id, 'ATM-TOKEN-19')
    const shown = show(all, 'ATM-TOKEN-19').text
    assert.ok(shown.startsWith('rs-cases:ATM-TOKEN-19 '), shown.slice(0, 80))
    assert.ok(shown.includes('module: atomic'))
  })
})

describe('graph headers', () => {
  it('extracts block, line, and shebang headers; nothing when bare', () => {
    assert.equal(
      extractHeader('/**\n * Does things.\n * Takes x.\n */\ncode();\n'),
      'Does things.\nTakes x.'
    )
    assert.equal(
      extractHeader('#!/usr/bin/env node\n// One.\n// Two.\ncode();\n'),
      'One.\nTwo.'
    )
    assert.equal(extractHeader('//! Rust docs.\nfn main() {}\n'), 'Rust docs.')
    assert.equal(extractHeader('# Shell docs.\nls\n'), 'Shell docs.')
    assert.equal(extractHeader('code();\n// trailing\n'), null)
  })

  it('chains ancestor readmes in walk order and caps depth', () => {
    const { dir, done } = fixture()
    try {
      mkdirSync(join(dir, 'a', 'b'), { recursive: true })
      writeFileSync(join(dir, 'README.md'), '# Root\n')
      writeFileSync(join(dir, 'a', 'README.md'), '# A\n')
      writeFileSync(join(dir, 'a', 'b', 'f.rs'), '//! F.\n')
      const file = join(dir, 'a', 'b', 'f.rs')
      assert.deepEqual(readmeChain(dir, file), [
        join(dir, 'a', 'README.md'),
        join(dir, 'README.md'),
      ])
      const full = chainShow(dir, file, Infinity)
      assert.ok(full.includes('//! F.'.replace('//! ', '')))
      assert.ok(full.includes('# A') && full.includes('# Root'))
      const capped = chainShow(dir, file, 0)
      assert.ok(!capped.includes('# A'))
    } finally {
      done()
    }
  })

  it('shows markdown files whole and never duplicates a readme target', () => {
    const { dir, done } = fixture()
    try {
      mkdirSync(join(dir, 'a'), { recursive: true })
      writeFileSync(join(dir, 'README.md'), '# Root\n')
      writeFileSync(join(dir, 'a', 'README.md'), '# A\nbody\n')
      writeFileSync(join(dir, 'a', 'note.md'), '# Title\n## Verdict\nwords\n')
      const note = chainShow(dir, join(dir, 'a', 'note.md'), 0)
      assert.ok(note.includes('# Title') && note.includes('## Verdict'))
      const self = chainShow(dir, join(dir, 'a', 'README.md'), Infinity)
      assert.equal(self.match(/^=== .*? ===$/gm).length, 2)
    } finally {
      done()
    }
  })
})

describe('engine', () => {
  it('loads four manifests plus the graph system collection', () => {
    const manifests = loadManifests()
    const names = manifests.map(m => m.name)
    for (const name of ['cases', 'components', 'graph', 'rs-cases', 'surfaces']) {
      assert.ok(names.includes(name), name)
    }
    assert.equal(manifests.find(m => m.name === 'graph').system, true)
  })

  it('ranks title matches above body matches', () => {
    const docs = [
      {
        collection: 't',
        id: 'a',
        title: 'harvest sinks',
        extra: '',
        path: '',
        snippetText: 'harvest sinks',
        fields: { title: 'harvest sinks', body: '' },
      },
      {
        collection: 't',
        id: 'b',
        title: 'other',
        extra: '',
        path: '',
        snippetText: 'talks about harvest sinks deep inside',
        fields: { title: 'other', body: 'talks about harvest sinks deep inside' },
      },
    ]
    const mini = buildIndex(docs, { title: 3 })
    assert.equal(mini.search('harvest sinks')[0].id, 't:a')
  })

  it('searches across collections and labels every hit', () => {
    const docs = [
      {
        collection: 'one',
        kind: 'markdown',
        id: 'a',
        title: 'alpha rays',
        extra: '',
        path: '',
        snippetText: 'alpha rays',
        fields: { title: 'alpha rays', body: '' },
        payload: {},
      },
      {
        collection: 'two',
        kind: 'markdown',
        id: 'b',
        title: 'beta rays',
        extra: '',
        path: '',
        snippetText: 'beta rays',
        fields: { title: 'beta rays', body: '' },
        payload: {},
      },
    ]
    const all = { docs, manifests: [], manifest: () => ({ weights: {} }) }
    const found = search(all, 'rays', {})
    assert.equal(found.hits.length, 2)
    assert.equal(found.total, 2)
    assert.deepEqual(found.hits.map(h => h.collection).sort(), ['one', 'two'])
    const targeted = search(all, 'rays', { collection: 'two' })
    assert.deepEqual(
      targeted.hits.map(h => h.id),
      ['b']
    )
    assert.equal(targeted.total, 1)
  })

  it('tags hits whose snippet shows no query term with matched fields', () => {
    const docs = [
      {
        collection: 'one',
        kind: 'markdown',
        id: 'a',
        title: 'namer talk',
        extra: '',
        path: '',
        snippetText: 'unrelated prose here',
        fields: { title: 'namer talk', body: 'unrelated prose here' },
        payload: {},
      },
    ]
    const all = { docs, manifests: [], manifest: () => ({ weights: {} }) }
    const found = search(all, 'namer', { collection: 'one' })
    assert.deepEqual(found.hits[0].matched, ['title'])
    assert.deepEqual(found.hits[0].fuzzy, [])
  })

  it('reports totals past the limit and de-duplicates snippets', () => {
    const docs = [1, 2, 3].map(n => ({
      collection: 'one',
      kind: 'markdown',
      id: `d${n}`,
      title: `shared rays ${n}`,
      extra: '',
      path: '',
      snippetText: `shared boilerplate rays\nunique line ${n}`,
      fields: { title: `shared rays ${n}`, body: 'shared boilerplate rays' },
      payload: {},
    }))
    const all = { docs, manifests: [], manifest: () => ({ weights: {} }) }
    const found = search(all, 'rays', { collection: 'one', limit: 2 })
    assert.equal(found.hits.length, 2)
    assert.equal(found.total, 3)
    assert.notEqual(found.hits[0].snippet, found.hits[1].snippet)
  })

  it('show fetches ids, flags ambiguity, and reports misses', () => {
    const docs = [
      {
        collection: 'one',
        kind: 'markdown',
        id: 'same',
        title: 'A',
        extra: '',
        path: 'a.md',
        snippetText: '',
        fields: {},
        payload: { raw: 'AAA' },
      },
      {
        collection: 'two',
        kind: 'markdown',
        id: 'same',
        title: 'B',
        extra: '',
        path: 'b.md',
        snippetText: '',
        fields: {},
        payload: { raw: 'BBB' },
      },
      {
        collection: 'one',
        kind: 'markdown',
        id: 'solo',
        title: 'S',
        extra: '',
        path: 's.md',
        snippetText: '',
        fields: {},
        payload: { raw: 'SSS' },
      },
    ]
    const all = { docs, manifests: [], manifest: () => ({ weights: {} }) }
    assert.ok(show(all, 'one:solo', {}).text.includes('SSS'))
    const ambiguous = show(all, 'same', {})
    assert.equal(ambiguous.ambiguous, true)
    assert.ok(show(all, 'two:same', {}).text.includes('BBB'))
    assert.equal(show(all, 'nope', {}).missing, true)
  })

  it('show resolves basenames, rs aliases, and .md forgiveness', () => {
    const docs = [
      {
        collection: 'notes',
        kind: 'markdown',
        id: 'x/summary.md',
        title: 'X',
        extra: '',
        path: 'x/summary.md',
        snippetText: '',
        fields: {},
        payload: { raw: 'XXX' },
      },
      {
        collection: 'notes',
        kind: 'markdown',
        id: 'y/summary.md',
        title: 'Y',
        extra: '',
        path: 'y/summary.md',
        snippetText: '',
        fields: {},
        payload: { raw: 'YYY' },
      },
      {
        collection: 'surfaces',
        kind: 'rs',
        id: 'rs:tiny',
        title: 'Tiny',
        extra: '',
        path: 'tiny',
        snippetText: '',
        fields: {},
        payload: { readme: 'R', related: [], suites: ['a.test.ts'], caseIds: ['C1'] },
      },
      {
        collection: 'doom',
        kind: 'markdown',
        id: 'note.md',
        title: 'N',
        extra: '',
        path: 'note.md',
        snippetText: '',
        fields: {},
        payload: { raw: 'NNN', tags: [], frontmatter: {} },
      },
    ]
    const all = { docs, manifests: [], manifest: () => ({ weights: {} }) }
    const multi = show(all, 'summary.md', {})
    assert.equal(multi.ambiguous, true)
    assert.ok(multi.text.includes('2 matches'))
    assert.ok(show(all, 'rs:tiny', {}).text.includes('Tiny'))
    assert.ok(show(all, 'tiny', {}).text.includes('Tiny'))
    assert.ok(show(all, 'SURFACES:rs:tiny', {}).text.includes('Tiny'))
    assert.ok(show(all, 'note', {}).text.includes('NNN'))
    assert.ok(show(all, 'surfaces:rs:tiny', {}).text.includes('a.test.ts'))
  })

  it('show pages candidates and returns them structured', () => {
    const docs = Array.from({ length: 12 }, (_, n) => ({
      collection: 'notes',
      kind: 'markdown',
      id: `d${n}/note.md`,
      title: `N${n}`,
      extra: '',
      path: `d${n}/note.md`,
      snippetText: '',
      fields: {},
      payload: { raw: 'x' },
    }))
    const all = { docs, manifests: [], manifest: () => ({ weights: {} }) }
    const def = show(all, 'note.md', {})
    assert.equal(def.ambiguous, true)
    assert.equal(def.candidates.length, 12)
    assert.ok(def.text.includes('…and 2 more (--limit 12 for all)'))
    const capped = show(all, 'note.md', { candidateLimit: 3 })
    assert.ok(capped.text.includes('…and 9 more (--limit 12 for all)'))
    assert.equal(capped.candidates.length, 12)
  })

  it('show resolves dirs, refuses outside paths, and guards --up', () => {
    const { dir, done } = fixture()
    try {
      mkdirSync(join(dir, 'pkg'), { recursive: true })
      writeFileSync(join(dir, 'pkg', 'README.md'), '# Pkg\n')
      writeFileSync(join(dir, 'pkg', 'f.rs'), '//! F.\n')
      const all = { docs: [], manifests: [], manifest: () => ({ weights: {} }) }
      assert.ok(show(all, 'pkg', { root: dir }).text.includes('# Pkg'))
      assert.ok(show(all, '../outside', { root: dir }).text.includes('outside the repo'))
      assert.ok(show(all, '/etc/passwd', { root: dir }).text.includes('outside the repo'))
    } finally {
      done()
    }
    const docs = [
      {
        collection: 'notes',
        kind: 'markdown',
        id: 'N1',
        title: 'T',
        extra: '',
        path: 'r.md',
        snippetText: '',
        fields: {},
        payload: { raw: 'NNN' },
      },
    ]
    const all = { docs, manifests: [], manifest: () => ({ weights: {} }) }
    assert.equal(show(all, 'N1', { up: 0, upExplicit: true }).misuse, true)
    assert.ok(show(all, 'N1', {}).text.includes('N1'))
  })
})

describe('docs-corpus contract', () => {
  it('reads frontmatter ids, not basenames, when the manifest asks', () => {
    const { dir, done } = fixture()
    try {
      mkdirSync(join(dir, 'panda'))
      mkdirSync(join(dir, 'chakra'))
      writeFileSync(
        join(dir, 'panda', 'installation.md'),
        '---\nid: panda:get-started/installation\ntitle: Install\n---\nbody one\n'
      )
      writeFileSync(
        join(dir, 'chakra', 'installation.md'),
        '---\nid: chakra:get-started/installation\ntitle: Install\n---\nbody two\n'
      )
      writeFileSync(join(dir, 'loose.md'), '# Loose\nno id here\n')
      const manifest = {
        name: 'c',
        kind: 'markdown',
        roots: [dir],
        include: ['**/*.md'],
        id: 'frontmatter',
        weights: {},
      }
      const { docs, warnings } = collectMarkdown(dir, manifest)
      assert.equal(warnings.length, 0)
      assert.deepEqual(docs.map(d => d.id).sort(), [
        'chakra:get-started/installation',
        'loose.md',
        'panda:get-started/installation',
      ])
    } finally {
      done()
    }
  })

  it('treats a missing optional root as an empty collection, not a warning', () => {
    const { dir, done } = fixture()
    try {
      const manifest = {
        name: 'c',
        kind: 'markdown',
        roots: [],
        include: ['**/*.md'],
        id: 'frontmatter',
        optional: true,
        weights: {},
      }
      assert.deepEqual(collectMarkdown(join(dir, 'nope'), manifest), { docs: [], warnings: [] })
    } finally {
      done()
    }
  })

  it('takes a frontmatter title over a body heading and keeps code-comment hashes', () => {
    const { dir, done } = fixture()
    try {
      writeFileSync(
        join(dir, 's.md'),
        '---\ntitle: Tokens › Semantic\n---\n## Semantic\n\n```bash\n# run it\n```\n'
      )
      const manifest = {
        name: 'c',
        kind: 'markdown',
        roots: [dir],
        include: ['*.md'],
        id: 'basename',
        weights: {},
      }
      const { docs } = collectMarkdown(dir, manifest)
      assert.equal(docs[0].title, 'Tokens › Semantic')
      assert.ok(docs[0].snippetText.includes('# run it'))
    } finally {
      done()
    }
  })

  it('ships docs-corpus as a targeted, optional, frontmatter-id collection', () => {
    const manifest = loadManifests().find(m => m.name === 'docs-corpus')
    assert.equal(manifest.targeted, true)
    assert.equal(manifest.optional, true)
    assert.equal(manifest.id, 'frontmatter')
    assert.ok(manifest.fields.includes('concepts'))
  })

  it('loads only the collections a verb needs', () => {
    const manifests = [
      { name: 'cases', kind: 'core' },
      { name: 'docs-corpus', kind: 'markdown', targeted: true },
      { name: 'graph', kind: 'graph', system: true },
    ]
    const names = opts => manifests.filter(scopeFor(opts)).map(m => m.name)
    assert.deepEqual(names({ cmd: 'search', in: 'docs-corpus', query: ['x'] }), ['docs-corpus'])
    assert.deepEqual(names({ cmd: 'search', in: null, query: ['x'] }), ['cases'])
    assert.deepEqual(names({ cmd: 'search', in: null, query: [] }), ['cases', 'docs-corpus', 'graph'])
    assert.deepEqual(names({ cmd: 'show', in: null, query: [] }), ['cases', 'docs-corpus', 'graph'])
  })
})

describe('docs-corpus engine', () => {
  /** A markdown doc shaped like a collected one, with a frontmatter block in its raw file. */
  const doc = (collection, id, title, { body = title, fields = {} } = {}) => {
    const url = `https://x.test/${id}`
    return {
      collection,
      kind: 'markdown',
      id,
      title,
      extra: '',
      path: id,
      snippetText: body,
      fields: { title, body, ...fields },
      payload: {
        raw: `---\nurl: ${url}\n---\n${body}\n`,
        tags: [],
        frontmatter: { url },
      },
    }
  }

  it('keeps a targeted collection out of global search but answers --in', () => {
    const docs = [doc('page', 'a', 'harvest notes'), doc('plain', 'b', 'harvest notes')]
    const manifests = [
      { name: 'page', kind: 'markdown', weights: { title: 9 }, targeted: true },
      { name: 'plain', kind: 'markdown', weights: {} },
    ]
    const all = { docs, manifests, manifest: name => manifests.find(m => m.name === name) }
    assert.deepEqual(
      search(all, 'harvest', {}).hits.map(h => h.collection),
      ['plain']
    )
    assert.equal(search(all, 'harvest', { collection: 'page' }).hits.length, 1)
  })

  it('finds pages by concept in a targeted collection, indexing only allowed fields', () => {
    const docs = [
      doc('corpus', 'panda:theming/conditions', 'Conditions', {
        fields: { concepts: 'dark-mode', url: 'zebra' },
      }),
      doc('corpus', 'panda:theming/tokens', 'Tokens', { fields: { concepts: 'tokens' } }),
    ]
    const manifest = {
      name: 'corpus',
      kind: 'markdown',
      targeted: true,
      fields: ['title', 'concepts'],
      weights: { concepts: 3 },
    }
    const all = { docs, manifests: [manifest], manifest: () => manifest }
    assert.equal(search(all, 'dark mode', { collection: 'corpus' }).hits[0].id, 'panda:theming/conditions')
    assert.equal(search(all, 'zebra', { collection: 'corpus' }).hits.length, 0)
  })

  it('shows a section by its id with the page url above the body alone', () => {
    const docs = [
      doc('corpus', 'panda:theming/tokens', 'Tokens', { body: '# Tokens\n\nPage intro.' }),
      doc('corpus', 'panda:theming/tokens#semantic-tokens', 'Tokens › Semantic tokens', {
        body: '## Semantic tokens\n\nSection body.',
      }),
    ]
    const all = { docs, manifests: [], manifest: () => ({ weights: {} }) }
    const section = show(all, 'panda:theming/tokens#semantic-tokens', {}).text
    assert.ok(section.startsWith('corpus:panda:theming/tokens#semantic-tokens — Tokens › Semantic tokens'))
    assert.ok(section.includes('url: https://x.test/panda:theming/tokens#semantic-tokens'))
    assert.ok(section.endsWith('## Semantic tokens\n\nSection body.'))
    assert.ok(!section.includes('Page intro'))
    assert.ok(show(all, 'corpus:panda:theming/tokens', {}).text.includes('Page intro.'))
  })

  it('loads only the requested collection when asked to', () => {
    const dir = mkdtempSync(join(tmpdir(), 'memex-scope-'))
    try {
      mkdirSync(join(dir, 'one'))
      writeFileSync(join(dir, 'one', 'a.md'), '# A\nalpha\n')
      const manifests = [
        { name: 'one', kind: 'markdown', roots: ['one'], include: ['**/*.md'], id: 'path', weights: {} },
        { name: 'two', kind: 'markdown', roots: ['one'], include: ['**/*.md'], id: 'path', weights: {} },
      ]
      const all = loadAll(manifests, dir, m => m.name === 'one')
      assert.deepEqual(Object.keys(all.counts), ['one'])
      assert.equal(all.docs.length, 1)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('title and concept matching', () => {
  const entry = (id, title, fields = {}) => ({
    collection: 'corpus',
    kind: 'markdown',
    id,
    title,
    extra: '',
    path: id,
    snippetText: fields.body ?? title,
    fields: { title, ...fields },
    payload: { raw: '', tags: [], frontmatter: {} },
  })
  const corpus = (docs, manifest) => ({ docs, manifests: [manifest], manifest: () => manifest })

  it('compares a title with the query by its stemmed content words', () => {
    const query = contentTerms('dark mode')
    assert.equal(titleSimilarity('Dark mode', query), 1)
    assert.equal(titleSimilarity('The dark mode of the app', query), 2 / 3)
    assert.equal(titleSimilarity('Tabs', query), 0)
    assert.equal(titleSimilarity('', query), 0)
    assert.deepEqual([...contentTerms('The Tabs of a page')].sort(), ['page', 'tab'])
  })

  it('expands a query with a concept whose keyword it contains, adding only missing words', () => {
    const vocabulary = {
      ssr: ['ssr', 'server-side rendering'],
      rtl: ['rtl', 'right to left'],
      'dark-mode': ['color mode', 'dark mode'],
    }
    assert.equal(expandQuery('server side rendering', vocabulary), 'server side rendering ssr')
    assert.equal(expandQuery('Right to left', vocabulary), 'Right to left rtl')
    assert.equal(expandQuery('color mode', vocabulary), 'color mode dark')
    assert.equal(expandQuery('dark mode', vocabulary), 'dark mode')
    assert.equal(expandQuery('tabs', vocabulary), 'tabs')
    assert.equal(expandQuery('ssr', null), 'ssr')
  })

  it('finds a doc by a synonym only when the manifest names the vocabulary', () => {
    const dir = mkdtempSync(join(tmpdir(), 'memex-vocab-'))
    try {
      const vocabFile = join(dir, 'concepts.json')
      writeFileSync(vocabFile, JSON.stringify({ ssr: ['server side rendering'] }))
      const docs = [entry('site:hydrate', 'Hydrating pages', { concepts: 'ssr', body: 'Hydrating pages.' })]
      const plain = { name: 'corpus', kind: 'markdown', targeted: true, fields: ['title', 'concepts'], weights: { concepts: 3 } }
      const withVocab = { ...plain, vocabulary: vocabFile }
      assert.deepEqual(search(corpus(docs, plain), 'server side rendering', { collection: 'corpus' }).hits, [])
      assert.deepEqual(
        search(corpus(docs, withVocab), 'server side rendering', { collection: 'corpus' }).hits.map(h => h.id),
        ['site:hydrate']
      )
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('lifts a page whose title is the query above a section that outscores it without the boost', () => {
    const filler = 'lorem ipsum dolor sit amet '.repeat(60)
    const docs = [
      entry('site:tabs', 'Tabs', { body: `Tabs are panels. ${filler}` }),
      entry('site:tabs#usage', 'Guide › Tabs', { body: 'Tabs tabs tabs tabs' }),
    ]
    const manifest = (titleBoost) => ({
      name: 'corpus',
      kind: 'markdown',
      targeted: true,
      fields: ['title', 'body'],
      weights: { title: 4, body: 1 },
      titleBoost,
    })
    assert.equal(search(corpus(docs, manifest(0)), 'tabs', { collection: 'corpus' }).hits[0].id, 'site:tabs#usage')
    assert.equal(search(corpus(docs, manifest(1)), 'tabs', { collection: 'corpus' }).hits[0].id, 'site:tabs')
  })

  it('ranks a page above its own section when pageBoost is set', () => {
    const docs = [
      entry('site:tabs#usage', 'Tabs', { body: 'tabs' }),
      entry('site:tabs', 'Tabs', { body: 'tabs' }),
    ]
    const manifest = {
      name: 'corpus',
      kind: 'markdown',
      targeted: true,
      fields: ['title', 'body'],
      weights: { title: 4, body: 1 },
      pageBoost: 3,
    }
    assert.equal(search(corpus(docs, manifest), 'tabs', { collection: 'corpus' }).hits[0].id, 'site:tabs')
  })

  it('caps the hits from one source in the top of the list, deferring the rest', () => {
    const filler = 'lorem ipsum dolor sit amet '.repeat(40)
    const docs = [
      entry('a:one', 'Tabs', { body: 'tabs' }),
      entry('a:two', 'Tabs', { body: 'tabs' }),
      entry('a:three', 'Tabs', { body: 'tabs' }),
      entry('b:one', 'Tabs', { body: `tabs ${filler}` }),
    ]
    const manifest = {
      name: 'corpus',
      kind: 'markdown',
      targeted: true,
      fields: ['title', 'body'],
      weights: { title: 4, body: 1 },
      diversity: { perSource: 2 },
    }
    const top = search(corpus(docs, manifest), 'tabs', { collection: 'corpus', limit: 3 }).hits.map(h => h.id)
    assert.ok(top.includes('b:one'), `expected the second source in the top three, got ${top.join(', ')}`)
    assert.equal(top.filter(id => id.startsWith('a:')).length, 2)
  })
})

describe('facets and per-source', () => {
  const entry = (id, title, fields = {}) => ({
    collection: 'corpus',
    kind: 'markdown',
    id,
    title,
    extra: '',
    path: id,
    snippetText: fields.body ?? title,
    fields: { title, ...fields },
    payload: { raw: '', tags: [], frontmatter: {} },
  })
  const manifest = (extra = {}) => ({
    name: 'corpus',
    kind: 'markdown',
    targeted: true,
    fields: ['title', 'body', 'source', 'type'],
    weights: { title: 4, body: 1 },
    ...extra,
  })
  const corpus = (docs, m) => ({ docs, manifests: [m], manifest: () => m })
  const filler = 'lorem ipsum dolor sit amet '.repeat(40)

  it('reads facets from frontmatter and matches them', () => {
    assert.deepEqual(facetsOf({ source: ' chakra ', type: 'theming', title: 'x' }), { source: 'chakra', type: 'theming' })
    assert.deepEqual(facetsOf({ source: '', title: 'x' }), {})
    assert.equal(matchesFacets({ source: 'Chakra', type: 'guide' }, { source: ['chakra', 'mantine'] }), true)
    assert.equal(matchesFacets({ source: 'chakra', type: 'guide' }, { source: ['chakra'], type: ['theming'] }), false)
    assert.equal(matchesFacets({ type: 'guide' }, { source: ['chakra'] }), false)
    assert.deepEqual(facetValues([{ source: 'b' }, { source: 'a' }, { source: 'B' }, {}], 'source'), ['a', 'b'])
  })

  it('filters a targeted search by source and type, every facet named must match', () => {
    const docs = [
      entry('a:one', 'Tabs', { source: 'a', type: 'component', body: 'tabs' }),
      entry('b:one', 'Tabs', { source: 'b', type: 'guide', body: 'tabs' }),
      entry('c:one', 'Tabs', { source: 'c', type: 'component', body: 'tabs' }),
    ]
    const all = corpus(docs, manifest())
    const ids = facets => search(all, 'tabs', { collection: 'corpus', facets }).hits.map(h => h.id).sort()
    assert.deepEqual(ids({ source: ['b', 'c'] }), ['b:one', 'c:one'])
    assert.deepEqual(ids({ source: ['a'], type: ['guide'] }), [])
    assert.deepEqual(ids({ type: ['component'] }), ['a:one', 'c:one'])
    assert.deepEqual(search(all, 'tabs', { collection: 'corpus', facets: { source: ['a'] } }).hits[0].facets, {
      source: 'a',
      type: 'component',
    })
  })

  it('refuses a value or a field the collection lacks, and facets or per-source without a collection', () => {
    const docs = [entry('a:one', 'Tabs', { source: 'a', body: 'tabs' }), entry('x:one', 'Other', { body: 'tabs' })]
    const all = corpus(docs, manifest())
    assert.throws(() => search(all, 'tabs', { collection: 'corpus', facets: { source: ['nope'] } }), /unknown source 'nope' in corpus \(known: a\)/)
    assert.throws(() => search(all, 'tabs', { collection: 'corpus', facets: { type: ['guide'] } }), /no type field/)
    assert.throws(() => search(all, 'tabs', { facets: { source: ['a'] } }), UsageError)
    assert.throws(() => search(all, 'tabs', { perSource: 1 }), UsageError)
  })

  it('shows the best N of each source, sources ordered by their best hit', () => {
    const docs = [
      entry('a:one', 'Tabs', { source: 'a', body: 'tabs' }),
      entry('b:one', 'Tabs', { source: 'b', body: `tabs ${filler}` }),
      entry('c:one', 'Tabs', { source: 'c', body: `tabs ${filler}${filler}` }),
    ]
    const top = search(corpus(docs, manifest()), 'tabs', { collection: 'corpus', perSource: 1, limit: Infinity })
    assert.deepEqual(top.hits.map(h => h.id), ['a:one', 'b:one', 'c:one'])
    assert.equal(top.total, 3)
  })

  it('keeps a page above its own section within a source when taking N per source', () => {
    const docs = [
      entry('a:page', 'Tabs', { source: 'a', body: 'tabs' }),
      entry('a:page#usage', 'Guide › Tabs', { source: 'a', body: 'tabs' }),
      entry('b:one', 'Tabs', { source: 'b', body: `tabs ${filler}` }),
    ]
    const all = corpus(docs, manifest({ pageBoost: 3 }))
    const two = search(all, 'tabs', { collection: 'corpus', perSource: 2, limit: Infinity })
    assert.deepEqual(two.hits.map(h => h.id), ['a:page', 'a:page#usage', 'b:one'])
    const one = search(all, 'tabs', { collection: 'corpus', perSource: 1, limit: Infinity })
    assert.deepEqual(one.hits.map(h => h.id), ['a:page', 'b:one'])
  })

  it('lists a roster narrowed by facets', () => {
    const docs = [entry('a:one', 'One', { source: 'a' }), entry('b:one', 'Two', { source: 'b' })]
    const all = corpus(docs, manifest())
    assert.deepEqual(roster(all, 'corpus', 10, { source: ['b'] }).docs.map(d => d.id), ['b:one'])
    assert.equal(roster(all, 'corpus', 10).total, 2)
  })

  it('filters and groups a persisted index the same way as the live docs', () => {
    const { dir, done } = fixture()
    try {
      mkdirSync(join(dir, 'pages'))
      writeFileSync(join(dir, 'pages', 'a.md'), '---\nid: corpus:a\ntitle: Tabs\nsource: a\ntype: component\n---\n# Tabs\ntabs here.\n')
      writeFileSync(join(dir, 'pages', 'b.md'), '---\nid: corpus:b\ntitle: Tabs\nsource: b\ntype: guide\n---\n# Tabs\ntabs and more tabs.\n')
      const m = manifest({ roots: ['pages'], include: ['**/*.md'], id: 'frontmatter' })
      const all = loadAll([m], dir)
      const docs = all.docs.map(d => ({ ...d, path: join(dir, d.path) }))
      const mini = buildIndex(docs, m.weights, m.fields)
      const base = join(dir, 'idx', 'corpus')
      writePersistedIndex({ base, mini, docs, manifest: m })
      const persisted = loadPersistedIndex(base, m)
      assert.ok(persisted, 'the pair loads')
      assert.deepEqual([...persisted.records.values()].map(r => r.facets.source).sort(), ['a', 'b'])
      const stored = { ...all, persisted: new Map([['corpus', persisted]]) }
      const facets = { type: ['guide'] }
      assert.deepEqual(
        search(stored, 'tabs', { collection: 'corpus', facets }).hits.map(h => h.id),
        search(all, 'tabs', { collection: 'corpus', facets }).hits.map(h => h.id)
      )
      assert.deepEqual(search(stored, 'tabs', { collection: 'corpus', facets }).hits.map(h => h.id), ['corpus:b'])
      assert.deepEqual(
        search(stored, 'tabs', { collection: 'corpus', perSource: 1, limit: Infinity }).hits.map(h => h.id),
        search(all, 'tabs', { collection: 'corpus', perSource: 1, limit: Infinity }).hits.map(h => h.id)
      )
    } finally {
      done()
    }
  })

  it('parses facet flags and refuses their misuse', async () => {
    const { parseArgs } = await import('./cli.mjs')
    const opts = parseArgs(['search', 'tabs', '--in', 'docs-corpus', '--source', 'chakra, mantine', '--type', 'guide', '--per-source', '2'])
    assert.deepEqual(opts.source, ['chakra', 'mantine'])
    assert.deepEqual(opts.type, ['guide'])
    assert.equal(opts.perSource, 2)
    assert.throws(() => parseArgs(['search', 'x', '--per-source', '0']), UsageError)
    assert.throws(() => parseArgs(['search', 'x', '--source', ' , ']), UsageError)
    assert.throws(() => parseArgs(['search', 'x', '--source', 'a', '--source', 'b']), UsageError)
  })

  it('refuses facet flags on show and without --in from the command line', () => {
    const cli = new URL('./cli.mjs', import.meta.url).pathname
    const failure = args => {
      try {
        execFileSync(process.execPath, [cli, ...args], { stdio: 'pipe', encoding: 'utf8' })
        return null
      } catch (err) {
        return { status: err.status, text: `${err.stdout}${err.stderr}` }
      }
    }
    const onShow = failure(['show', 'x', '--source', 'chakra'])
    assert.equal(onShow.status, 2)
    assert.match(onShow.text, /apply to search only/)
    const noIn = failure(['search', 'tabs', '--source', 'chakra'])
    assert.equal(noIn.status, 2)
    assert.match(noIn.text, /need --in/)
  })
})

describe('vanishing entries and persisted indexes', () => {
  it('skips an entry that vanishes during the walk', () => {
    const { dir, done } = fixture()
    try {
      writeFileSync(join(dir, 'a.md'), '# A\nbody\n')
      symlinkSync(join(dir, 'gone-target'), join(dir, 'gone.md'))
      const manifest = { name: 't', kind: 'markdown', roots: ['.'], include: ['**/*.md'], id: 'path', weights: {} }
      assert.deepEqual(collectMarkdown(dir, manifest).docs.map(d => d.id), ['a.md'])
    } finally {
      done()
    }
  })

  it('answers a targeted search from the persisted index with the live hits and snippets', () => {
    const { dir, done } = fixture()
    try {
      mkdirSync(join(dir, 'pages'))
      writeFileSync(join(dir, 'pages', 'a.md'), '---\nid: x:a\ntitle: Dark mode guide\nconcepts: [dark-mode]\n---\n# Dark mode guide\nUse data-theme for dark mode.\n')
      writeFileSync(join(dir, 'pages', 'b.md'), '---\nid: x:b\ntitle: Tokens\n---\n# Tokens\nSemantic tokens here.\n')
      const manifest = {
        name: 'corpus',
        kind: 'markdown',
        roots: ['pages'],
        include: ['**/*.md'],
        id: 'frontmatter',
        targeted: true,
        fields: ['title', 'concepts', 'body'],
        weights: { title: 4, concepts: 3, body: 1 },
      }
      const all = loadAll([manifest], dir)
      const docs = all.docs.map(d => ({ ...d, path: join(dir, d.path) }))
      const mini = buildIndex(docs, manifest.weights, manifest.fields)
      const base = join(dir, 'idx', 'corpus')
      writePersistedIndex({ base, mini, docs, manifest })
      const persisted = loadPersistedIndex(base, manifest)
      assert.ok(persisted, 'the pair loads')
      const live = search(all, 'dark mode', { collection: 'corpus' })
      const stored = search({ ...all, persisted: new Map([['corpus', persisted]]) }, 'dark mode', { collection: 'corpus' })
      assert.deepEqual(stored.hits.map(h => h.id), live.hits.map(h => h.id))
      assert.deepEqual(stored.hits.map(h => h.snippet), live.hits.map(h => h.snippet))
      assert.equal(stored.total, live.total)
    } finally {
      done()
    }
  })

  it('treats a records file that disagrees with its index as absent', () => {
    const { dir, done } = fixture()
    try {
      const manifest = { name: 'corpus', kind: 'markdown', fields: ['title'], weights: {} }
      const mini = buildIndex([{ collection: 'corpus', kind: 'markdown', id: 'a', title: 'A', extra: '', path: join(dir, 'a.md'), snippetText: '', fields: { title: 'A' }, payload: {} }], {}, ['title'])
      const base = join(dir, 'corpus')
      writePersistedIndex({ base, mini, docs: [{ collection: 'corpus', id: 'a', title: 'A', extra: '', path: join(dir, 'a.md') }], manifest })
      assert.ok(loadPersistedIndex(base, manifest))
      writeFileSync(`${base}.records.json`, JSON.stringify({ format: 1, collection: 'corpus', count: 2, records: [] }))
      assert.equal(loadPersistedIndex(base, manifest), null)
    } finally {
      done()
    }
  })

  it('names a persisted index only for a targeted search with a query on a manifest that has one', () => {
    const { dir, done } = fixture()
    try {
      const manifest = { name: 'corpus', kind: 'markdown', index: 'idx/corpus', fields: ['title'], weights: {} }
      const opts = { cmd: 'search', in: 'corpus', query: ['x'] }
      assert.equal(persistedFor([manifest], opts, dir).size, 0, 'no files yet')
      const mini = buildIndex([], {}, ['title'])
      writePersistedIndex({ base: join(dir, 'idx', 'corpus'), mini, docs: [], manifest })
      assert.equal(persistedFor([manifest], opts, dir).has('corpus'), true)
      assert.equal(persistedFor([manifest], { ...opts, query: [] }, dir).size, 0, 'a listing never uses it')
      assert.equal(persistedFor([manifest], { cmd: 'search', in: null, query: ['x'] }, dir).size, 0, 'global never uses it')
    } finally {
      done()
    }
  })
})

describe('cli', () => {
  it('prints usage for help without loading collections', () => {
    const out = execFileSync(process.execPath, ['.agents/memex/cli.mjs', '--help'], {
      encoding: 'utf8',
    })
    assert.ok(out.includes('usage:'))
    assert.ok(out.includes('search') && out.includes('show'))
  })

  it('parses flags strictly without exiting', async () => {
    const { parseArgs } = await import('./cli.mjs')
    const { UsageError } = await import('./lib.mjs')
    assert.deepEqual(parseArgs(['search', '--in', 'doom', 'x']).in, 'doom')
    assert.deepEqual(parseArgs(['search', 'x', '--help']).cmd, 'help')
    assert.deepEqual(parseArgs(['search', 'help']).query, ['help'])
    assert.deepEqual(parseArgs(['search', '--', '--in']).query, ['--in'])
    assert.deepEqual(parseArgs(['show', 'a', '--up', '2']).up, 2)
    assert.throws(() => parseArgs(['search', 'x', '--bogus']), UsageError)
    assert.throws(() => parseArgs(['search', 'x', '--in', 'a', '--in', 'b']), UsageError)
    assert.throws(() => parseArgs(['search', 'x', '--limit', '1e2']), UsageError)
    assert.throws(() => parseArgs(['search', 'x', '--limit', '-1']), UsageError)
    assert.throws(() => parseArgs(['nope']), UsageError)
    assert.deepEqual(parseArgs(['search', 'x', '--limit', '0']).limit, 0)
  })
})
