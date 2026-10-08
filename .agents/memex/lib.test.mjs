/**
 * Memex unit tests: pure functions plus tmp-fixture collectors.
 * Run: node --test .agents/memex/
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  collectMarkdown,
  collectNeo,
  collectPerf,
  collectRs,
  formatPerfShow,
  matchGlob,
  perfCounts,
  substringSearch,
} from './adapters.mjs'
import { chainShow, extractHeader, readmeChain } from './graph.mjs'
import { buildIndex, loadManifests, search, show } from './lib.mjs'
import {
  extractTitle,
  firstParagraph,
  levenshtein,
  parseFrontmatter,
  parseTags,
  processTerm,
  snippet,
  stem,
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
    assert.equal(stem('NEO-CHAIN-01'), 'NEO-CHAIN-01')
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

describe('neo collector', () => {
  it('builds one doc per case dir from meta, readme, and specs', () => {
    const { dir, done } = fixture()
    try {
      const cased = join(dir, 'fam', 'NEO-X-01')
      mkdirSync(join(cased, 'specs'), { recursive: true })
      writeFileSync(
        join(cased, 'case.json'),
        JSON.stringify({ id: 'NEO-X-01', name: 'X one' })
      )
      writeFileSync(join(cased, 'README.md'), '# X\nAbout x.\n')
      writeFileSync(join(cased, 'specs', 'a.spec.ts'), 'test(x)\n')
      mkdirSync(join(cased, 'specs', 'world'))
      writeFileSync(join(cased, 'specs', 'world', 'gen.spec.ts'), 'generated\n')
      writeFileSync(join(dir, 'fam', ' stray.json'), '{}')
      const { docs } = collectNeo(join(dir, 'fam'), dir, 'cases')
      assert.equal(docs.length, 1)
      assert.equal(docs[0].id, 'NEO-X-01')
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

describe('perf', () => {
  const entries = [
    {
      id: 'PERF-W1-A',
      wave: 'wave-1',
      topic: 'clone plasma',
      kind: 'diet',
      verdict: 'BANK',
      effect: { ms: 3 },
      files: [],
      report: 'r.md',
      patch: null,
      summary: 'clones less',
      log: 'landed set-1',
    },
    {
      id: 'PERF-W1-B',
      wave: 'wave-2',
      topic: 'hashers',
      kind: 'diet',
      verdict: 'CUT',
      effect: {},
      files: [],
      report: 'r.md',
      patch: null,
      summary: 'no win',
      log: null,
    },
  ]

  it('substring search ANDs words and ranks exact id hits first', () => {
    assert.deepEqual(
      substringSearch(entries, 'clone plasma').map(e => e.id),
      ['PERF-W1-A']
    )
    assert.deepEqual(substringSearch(entries, 'clone hashers'), [])
    assert.deepEqual(
      substringSearch(entries, 'perf-w1-a').map(e => e.id),
      ['PERF-W1-A']
    )
  })

  it('field:value tokens filter exactly; unknown fields stay literal', () => {
    assert.deepEqual(
      substringSearch(entries, 'verdict:bank').map(e => e.id),
      ['PERF-W1-A']
    )
    assert.deepEqual(
      substringSearch(entries, 'verdict:BANK wave:wave-2').map(e => e.id),
      []
    )
    assert.deepEqual(
      substringSearch(entries, 'verdict:cut hashers').map(e => e.id),
      ['PERF-W1-B']
    )
    assert.deepEqual(
      substringSearch(entries, 'rs:atlas').map(e => e.id),
      []
    )
  })

  it('overrule notes are searchable and marked on one-liners', () => {
    const over = [
      {
        id: 'INT-1',
        wave: 'wave-1',
        topic: 'set',
        kind: 'integration',
        verdict: 'LAND',
        effect: {},
        files: [],
        report: 'r.md',
        patch: null,
        summary: 's',
        log: null,
        overruledBy: 'INT-2 — captain held x',
      },
    ]
    assert.deepEqual(
      substringSearch(over, 'overruled').map(e => e.id),
      ['INT-1']
    )
    assert.deepEqual(substringSearch(entries, 'overruled'), [])
    const { dir, done } = fixture()
    try {
      const p = join(dir, 'perf-index.json')
      writeFileSync(p, JSON.stringify({ count: 1, built: 'today', entries: over }))
      const { docs } = collectPerf(p, 'perf')
      assert.ok(docs[0].extra.includes('† superseded by INT-2'))
    } finally {
      done()
    }
  })

  it('counts waves and verdicts', () => {
    assert.deepEqual(perfCounts(entries), {
      waves: { 'wave-1': 1, 'wave-2': 1 },
      verdicts: { BANK: 1, CUT: 1 },
    })
  })

  it('show format carries report, files, summary, and log', () => {
    const text = formatPerfShow({
      ...entries[0],
      files: ['a.rs'],
      landedIn: 'tree',
      landing: 'abc',
      overruledBy: null,
    })
    for (const needle of [
      'PERF-W1-A',
      'report: r.md',
      'a.rs',
      'clones less',
      'landed set-1',
      'abc',
    ]) {
      assert.ok(text.includes(needle), needle)
    }
  })

  it('collects index json into docs', () => {
    const { dir, done } = fixture()
    try {
      const p = join(dir, 'perf-index.json')
      writeFileSync(p, JSON.stringify({ count: 2, built: 'today', entries }))
      const { docs } = collectPerf(p, 'perf')
      assert.equal(docs.length, 2)
      assert.equal(docs[0].extra, '[BANK]  3ms')
    } finally {
      done()
    }
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
  it('loads five manifests plus the graph system collection', () => {
    const manifests = loadManifests()
    const names = manifests.map(m => m.name)
    for (const name of ['cases', 'doom', 'flames', 'graph', 'perf', 'surfaces']) {
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
        collection: 'flames',
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
        collection: 'flames',
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
      collection: 'flames',
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
        collection: 'perf',
        kind: 'perf',
        id: 'P1',
        title: 'T',
        extra: '[BANK]',
        path: 'r.md',
        snippetText: '',
        fields: {},
        payload: {
          entry: { id: 'P1', topic: 'T', kind: 'diet', verdict: 'BANK', report: 'r.md' },
        },
      },
    ]
    const all = { docs, manifests: [], manifest: () => ({ weights: {} }) }
    assert.equal(show(all, 'P1', { up: 0, upExplicit: true }).misuse, true)
    assert.ok(show(all, 'P1', {}).text.includes('P1'))
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
