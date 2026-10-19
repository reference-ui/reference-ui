#!/usr/bin/env node
/**
 * Retrieval eval for the docs-corpus Memex collection.
 *
 *   node .agents/docs-corpus/normalize/eval/eval.mjs            faceted (default): how a writer searches
 *   node .agents/docs-corpus/normalize/eval/eval.mjs --strict   strict: each entry's expect in one unfiltered search
 *
 * queries.json holds one entry per phrasing, grouped into intents.
 *
 * Faceted: each `libs` item is one library's expectation, checked as
 * `search <q> --in docs-corpus --source <s> --limit 3`; an `any` group passes
 * when one alternative does. Each intent also gets one `--per-source 1` check on
 * its first phrasing: every source its libs name must have a hit in that list.
 * An intent passes when all its entries and that check pass.
 *
 * Strict: an entry passes when every `expect` regex matches a hit in the top k of
 * an unfiltered search, and an intent when all its entries pass.
 *
 * Every CLI call is timed end to end; latency is reported over all calls of the run.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { REPO } from '../lib/paths.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
/** EVAL_CLI points the harness at another Memex copy (for example a HEAD checkout) to compare engines. */
const CLI = process.env.EVAL_CLI ?? join(REPO, '.agents', 'memex', 'cli.mjs')
const QUERIES = join(HERE, 'queries.json')
const STRICT = process.argv.includes('--strict')
const LATENCY_BUDGET_MS = 1500
const FACET_LIMIT = 3
/** How many returned ids a FAIL prints; EVAL_TOP=10 shows a full first page. */
const TOP_SHOWN = Number(process.env.EVAL_TOP ?? 5)
const MAX_BUFFER = 64 * 1024 * 1024

const latencies = []
const cache = new Map()

/** One docs-corpus search, timed. An identical call is answered from the cache and not timed again. */
function search(args) {
  const key = args.join('\u0000')
  if (cache.has(key)) return cache.get(key)
  const started = performance.now()
  const out = execFileSync(process.execPath, [CLI, 'search', ...args, '--in', 'docs-corpus', '--json'], {
    cwd: REPO,
    encoding: 'utf8',
    maxBuffer: MAX_BUFFER,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const ms = performance.now() - started
  latencies.push(ms)
  const result = { hits: JSON.parse(out).hits }
  cache.set(key, result)
  return result
}

const sourceOf = id => id.split(':')[0]

/** The 1-based rank of the first hit within the top k whose id matches the pattern, or null. */
function rankOf(hits, pattern, k) {
  const re = new RegExp(pattern)
  const at = hits.slice(0, k).findIndex(hit => re.test(hit.id))
  return at === -1 ? null : at + 1
}

/** One library's expectation: is the expected page or section among that library's top FACET_LIMIT hits? */
function judgeLib(q, lib) {
  const { hits } = search([q, '--source', lib.source, '--limit', String(FACET_LIMIT)])
  return {
    source: lib.source,
    expect: lib.expect,
    rank: rankOf(hits, lib.expect, FACET_LIMIT),
    top: hits.slice(0, TOP_SHOWN).map(hit => hit.id),
  }
}

/** A lib item, or an `any` group that passes when one of its alternatives does. */
function judgeItem(q, item) {
  if (item.any) {
    const alternatives = item.any.map(lib => judgeLib(q, lib))
    return { any: alternatives, pass: alternatives.some(alt => alt.rank !== null) }
  }
  const result = judgeLib(q, item)
  return { ...result, pass: result.rank !== null }
}

function labelOf(result) {
  if (result.any) return `(${result.any.map(labelOf).join(' | ')})`
  return `${result.source}:${result.rank ?? 'miss'}`
}

/** The per-source check of an intent, from its first phrasing: each library its entries name has a best hit. */
function judgePerSource(list) {
  const { hits } = search([list[0].q, '--per-source', '1'])
  const present = new Set(hits.map(hit => sourceOf(hit.id)))
  const required = new Map()
  for (const entry of list) {
    for (const item of entry.libs ?? []) {
      const alternatives = item.any ?? [item]
      const key = alternatives.map(lib => lib.source).sort().join(' | ')
      required.set(key, alternatives.map(lib => lib.source))
    }
  }
  const missing = [...required.entries()]
    .filter(([, sources]) => !sources.some(source => present.has(source)))
    .map(([key]) => key)
  return { pass: missing.length === 0, missing, shown: hits.length, sources: present.size }
}

/** Strict: each expect regex must match a hit in the entry's top k of the unfiltered search. */
function judgeStrict(entry) {
  const { hits } = search([entry.q, '--limit', String(entry.k)])
  const found = entry.expect.map(pattern => ({ pattern, rank: rankOf(hits, pattern, entry.k) }))
  return {
    pass: found.every(f => f.rank !== null),
    missing: found.filter(f => f.rank === null).map(f => f.pattern),
    ranks: found.filter(f => f.rank !== null).map(f => f.rank),
    top: hits.slice(0, TOP_SHOWN).map(hit => hit.id),
  }
}

function percentile(sorted, p) {
  return sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)]
}

const entries = JSON.parse(readFileSync(QUERIES, 'utf8'))
const intents = new Map()
for (const entry of entries) {
  const list = intents.get(entry.intent) ?? []
  list.push(entry)
  intents.set(entry.intent, list)
}

let entriesPassing = 0
let intentsPassing = 0
const failingIntents = []

for (const [number, list] of intents) {
  const label = entry => `i${String(number).padStart(2, '0')} "${entry.q}"`
  let intentPass = true
  for (const entry of list) {
    if (STRICT) {
      const result = judgeStrict(entry)
      if (result.pass) entriesPassing++
      intentPass = intentPass && result.pass
      console.log(`${result.pass ? 'PASS' : 'FAIL'}  ${label(entry).padEnd(34)} ${result.pass ? `ranks ${result.ranks.join(',')}` : `missing ${result.missing.join('  ')}`}`)
      if (!result.pass) console.log(`      top ${TOP_SHOWN}: ${result.top.join('  ')}`)
      if (entry.note) console.log(`      note: ${entry.note}`)
      continue
    }
    const results = (entry.libs ?? []).map(item => judgeItem(entry.q, item))
    const pass = results.every(result => result.pass)
    if (pass) entriesPassing++
    intentPass = intentPass && pass
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${label(entry).padEnd(34)} ${results.map(labelOf).join('  ')}`)
    for (const result of results.filter(r => !r.pass)) {
      const misses = result.any ? result.any : [result]
      for (const miss of misses.filter(m => m.rank === null)) {
        console.log(`      ${miss.source} missing ${miss.expect}; top ${FACET_LIMIT} in ${miss.source}: ${miss.top.slice(0, FACET_LIMIT).join('  ')}`)
      }
    }
    if (entry.note) console.log(`      note: ${entry.note}`)
  }
  if (!STRICT) {
    const check = judgePerSource(list)
    intentPass = intentPass && check.pass
    console.log(
      `      per-source 1 ("${list[0].q}"): ${check.pass ? 'PASS' : `FAIL missing ${check.missing.join(', ')}`} ` +
        `(${check.sources} sources answered)`
    )
  }
  if (intentPass) intentsPassing++
  else failingIntents.push(number)
}

const sorted = [...latencies].sort((a, b) => a - b)
const p50 = Math.round(percentile(sorted, 0.5))
const max = Math.round(sorted[sorted.length - 1])
const mode = STRICT ? 'strict' : 'faceted'

console.log('')
console.log(`mode: ${mode}`)
console.log(`entries passing: ${entriesPassing}/${entries.length}`)
console.log(`intents passing: ${intentsPassing}/${intents.size}`)
if (failingIntents.length) console.log(`failing intents: ${failingIntents.join(', ')}`)
console.log(
  `latency per CLI call (end to end, ${sorted.length} calls): p50 ${p50}ms, max ${max}ms, ` +
    `budget ${LATENCY_BUDGET_MS}ms ${max < LATENCY_BUDGET_MS ? 'PASS' : 'FAIL'}`
)
console.log(`SCORE ${entriesPassing}/${entries.length} entries, ${intentsPassing}/${intents.size} intents (${mode})`)
