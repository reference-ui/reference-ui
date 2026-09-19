/**
 * Doom log lib + CLI tests. Zero-dep (node:test); fixtures live in a
 * temp dir so the real logs/ is never touched.
 *
 *   node --test .agents/doom/lib.test.mjs
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  buildIndex,
  DEFAULT_LIMIT,
  loadDocs,
  parseArgs,
  parseLog,
  searchDocs,
  snippet,
  SNIPPET_MAX_LENGTH,
  UsageError,
} from './lib.mjs'

const CLI = fileURLToPath(new URL('./cli.mjs', import.meta.url))

const HARVEST = `---
date: 2099-01-01
cycle: 0
module: atomic/extract/harvest
brief: "probe sinks"
theories_spent: 1
verdict: clean-hunt
---

# Sink probe

## Hypothesis

sink coverage gap on dynamic color members.

## Verdict

clean-hunt. Plain body line about nothing in particular.
`

const LADDER = `---
date: 2099-01-02
cycle: 0
module: module-graph/ladder
brief: "probe aliases"
theories_spent: 0
verdict: break-found
---

# Alias probe

Body mentions tsconfig alias arms.
`

function fixtureDir() {
  const dir = mkdtempSync(join(tmpdir(), 'doom-test-'))
  writeFileSync(join(dir, 'a-harvest.md'), HARVEST)
  writeFileSync(join(dir, 'b-ladder.md'), LADDER)
  writeFileSync(join(dir, 'notes.txt'), 'not markdown')
  return dir
}

function runCli(args, logsDir) {
  try {
    const stdout = execFileSync('node', [CLI, ...args], {
      env: { ...process.env, DOOM_LOGS_DIR: logsDir },
      encoding: 'utf8',
    })
    return { code: 0, stdout, stderr: '' }
  } catch (err) {
    return { code: err.status, stdout: err.stdout || '', stderr: err.stderr || '' }
  }
}

describe('parseLog', () => {
  it('reads frontmatter, title, and hypothesis section', () => {
    const doc = parseLog('a-harvest.md', HARVEST)
    assert.equal(doc.module, 'atomic/extract/harvest')
    assert.equal(doc.brief, 'probe sinks')
    assert.equal(doc.verdict, 'clean-hunt')
    assert.equal(doc.title, 'Sink probe')
    assert.match(doc.hypothesis, /sink coverage gap/)
    assert.match(doc.body, /Plain body line/)
  })

  it('survives missing frontmatter', () => {
    const doc = parseLog('x.md', '# Bare\n\nJust words.\n')
    assert.equal(doc.title, 'Bare')
    assert.equal(doc.module, undefined)
    assert.match(doc.body, /Just words/)
  })

  it('falls back to the filename when there is no heading', () => {
    const doc = parseLog('x.md', 'Just words.\n')
    assert.equal(doc.title, 'x.md')
    assert.equal(doc.body, 'Just words.')
    assert.equal(doc.hypothesis, '')
  })

  it('ignores unknown frontmatter keys and keeps the filename id', () => {
    const raw = '---\nid: forged\nnonsense: 1\nmodule: m\n---\n\n# T\n\nBody.\n'
    const doc = parseLog('real.md', raw)
    assert.equal(doc.id, 'real.md')
    assert.equal(doc.module, 'm')
    assert.equal(doc.nonsense, undefined)
  })

  it('strips only matched quote pairs', () => {
    const quoted = parseLog('q.md', '---\nbrief: "probe sinks"\n---\n\n# T\n\nB.\n')
    assert.equal(quoted.brief, 'probe sinks')
    const bare = parseLog('b.md', '---\nbrief: trailing"\n---\n\n# T\n\nB.\n')
    assert.equal(bare.brief, 'trailing"')
  })
})

describe('loadDocs', () => {
  it('loads markdown only', () => {
    const docs = loadDocs(fixtureDir())
    assert.deepStrictEqual(docs.map(d => d.id).sort(), ['a-harvest.md', 'b-ladder.md'])
    assert.equal(docs.find(d => d.id === 'a-harvest.md').title, 'Sink probe')
  })
})

describe('searchDocs', () => {
  it('ranks the hypothesis-bearing report first', () => {
    const hits = searchDocs(loadDocs(fixtureDir()), 'sink coverage color')
    assert.equal(hits[0].id, 'a-harvest.md')
    assert.equal(hits[0].module, 'atomic/extract/harvest')
  })

  it('finds module-scoped terms and honors limit', () => {
    const hits = searchDocs(loadDocs(fixtureDir()), 'ladder alias', 1)
    assert.equal(hits.length, 1)
    assert.equal(hits[0].id, 'b-ladder.md')
  })

  it('returns nothing usable on no match', () => {
    assert.deepStrictEqual(searchDocs(loadDocs(fixtureDir()), 'zzzqqq'), [])
  })

  it('returns no hits when the limit is zero', () => {
    assert.deepStrictEqual(searchDocs(loadDocs(fixtureDir()), 'sink', 0), [])
  })
})

describe('snippet', () => {
  it('prefers the matching line', () => {
    const out = snippet('first line\nneedle here\nlast line', ['needle'])
    assert.equal(out, 'needle here')
  })

  it('falls back to the first line', () => {
    const out = snippet('first line\nsecond', ['absent'])
    assert.equal(out, 'first line')
  })

  it('matches case-insensitively', () => {
    const out = snippet('first line\nNEEDLE here\nlast line', ['needle'])
    assert.equal(out, 'NEEDLE here')
  })

  it('skips blank lines', () => {
    const out = snippet('\n\nfirst\nsecond', ['absent'])
    assert.equal(out, 'first')
  })

  it('caps long lines', () => {
    const out = snippet('x'.repeat(SNIPPET_MAX_LENGTH + 50), ['zzz'])
    assert.equal(out.length, SNIPPET_MAX_LENGTH)
  })
})

describe('parseArgs', () => {
  it('parses search with flags', () => {
    assert.deepStrictEqual(parseArgs(['search', 'a', 'b', '--limit', '3', '--json']), {
      cmd: 'search',
      query: 'a b',
      limit: 3,
      json: true,
    })
  })

  it('parses bare index', () => {
    assert.deepStrictEqual(parseArgs(['index']), { cmd: 'index' })
  })

  it('rejects misuse', () => {
    for (const argv of [[], ['search'], ['frobnicate'], ['index', 'extra']]) {
      assert.throws(() => parseArgs(argv), UsageError)
    }
  })

  it('falls back to the default limit', () => {
    assert.equal(parseArgs(['search', 'q', '--limit', 'banana']).limit, DEFAULT_LIMIT)
    assert.equal(parseArgs(['search', 'q', '--limit']).limit, DEFAULT_LIMIT)
  })

  it('honors an explicit zero limit', () => {
    assert.equal(parseArgs(['search', 'q', '--limit', '0']).limit, 0)
  })
})

describe('buildIndex', () => {
  it('indexes empty docs without error', () => {
    const mini = buildIndex([])
    assert.deepStrictEqual(mini.search('anything'), [])
  })
})

describe('cli', () => {
  it('index reports counts', () => {
    const r = runCli(['index'], fixtureDir())
    assert.equal(r.code, 0)
    assert.match(r.stdout, /2 report\(s\) indexed/)
    assert.match(r.stdout, /a-harvest\.md \[atomic\/extract\/harvest\] clean-hunt/)
  })

  it('search prints ranked hits', () => {
    const r = runCli(['search', 'harvest sink'], fixtureDir())
    assert.equal(r.code, 0)
    assert.match(r.stdout, /a-harvest\.md \(score/)
    assert.match(r.stdout, /sink coverage gap/)
  })

  it('search --json emits parseable hits', () => {
    const r = runCli(['search', 'alias', '--json'], fixtureDir())
    assert.equal(r.code, 0)
    const hits = JSON.parse(r.stdout)
    assert.equal(hits[0].id, 'b-ladder.md')
    assert.ok(typeof hits[0].score === 'number')
  })

  it('search --limit bounds the hits', () => {
    const dir = fixtureDir()
    const unbounded = runCli(['search', 'probe', '--json'], dir)
    assert.equal(unbounded.code, 0)
    assert.equal(JSON.parse(unbounded.stdout).length, 2)
    const bounded = runCli(['search', 'probe', '--json', '--limit', '1'], dir)
    assert.equal(bounded.code, 0)
    assert.equal(JSON.parse(bounded.stdout).length, 1)
  })

  it('no match exits 0 with a message', () => {
    const r = runCli(['search', 'zzzqqq'], fixtureDir())
    assert.equal(r.code, 0)
    assert.match(r.stdout, /no matches/)
  })

  it('no match with --json emits an empty array', () => {
    const r = runCli(['search', 'zzzqqq', '--json'], fixtureDir())
    assert.equal(r.code, 0)
    assert.deepStrictEqual(JSON.parse(r.stdout), [])
  })

  it('misuse exits 2 with usage', () => {
    const r = runCli(['search'], fixtureDir())
    assert.equal(r.code, 2)
    assert.match(r.stderr, /usage:/)
  })

  it('unknown commands exit 2 with usage', () => {
    const r = runCli(['frobnicate'], fixtureDir())
    assert.equal(r.code, 2)
    assert.match(r.stderr, /usage:/)
  })
})
