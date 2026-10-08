#!/usr/bin/env node
/**
 * Memex CLI (thin wrapper; logic lives in lib.mjs).
 *
 *   node .agents/memex/cli.mjs search [<query...>] [--in <coll>] [--limit N] [--json]
 *   node .agents/memex/cli.mjs show <id-or-path> [--up N] [--json]
 *
 * Search with no query lists collections, or one collection's roster
 * with --in. Show resolves paths through the graph and ids to docs.
 * Exit codes: 0 success (including no matches), 1 not found, 2 misuse.
 * With --json, stdout is always JSON — including error envelopes.
 */

import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CANDIDATE_CAP,
  COLLECTIONS_DIR,
  DEFAULT_LIMIT,
  LIST_CAP,
  ROOT,
  UsageError,
  collectionTable,
  loadAll,
  loadManifests,
  roster,
  search,
  show,
} from './lib.mjs'

const EXIT_MISUSE = 2
const EXIT_NOT_FOUND = 1
const SCORE_DECIMALS = 3
const JSON_INDENT = 2

const USAGE = `memex — one CLI over every agent collection.

usage:
  cli.mjs search [<query...>] [--in <coll>] [--limit N] [--json]
  cli.mjs show <id-or-path> [--up N] [--limit N] [--json]

  search with no query lists collections (--in lists one roster).
  show resolves paths through the graph, ids to docs (--limit pages
  ambiguous-id candidates).
  ranked search is stemmed + fuzzy (default --limit 15) except
  targeted perf search, which is exact substring-AND; perf also
  takes verdict:/wave:/kind: filters. --up applies to paths only.`

function emitError(message, json) {
  if (json) {
    console.log(JSON.stringify({ error: message }))
  } else {
    console.error(message)
  }
}

function fail(message, json = false) {
  emitError(message, json)
  process.exit(EXIT_MISUSE)
}

function parseCount(value, flag) {
  if (!/^\d+$/.test(value)) {
    throw new UsageError(`${flag} needs a non-negative integer, got '${value}'`)
  }
  return Number(value)
}

/** Parse CLI args; throws UsageError on misuse. Never exits. */
export function parseArgs(argv) {
  const failWith = (message, json) => {
    throw new UsageError(message, json)
  }
  const [cmd, ...rest] = argv
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    return { cmd: 'help' }
  }
  if (cmd !== 'search' && cmd !== 'show') {
    failWith(`unknown command '${cmd}'\n${USAGE}`, argv.includes('--json'))
  }
  const opts = {
    query: [],
    ref: [],
    in: null,
    limit: null,
    up: null,
    json: false,
  }
  const seen = new Set()
  let positionalOnly = false
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i]
    if (!positionalOnly && arg === '--') {
      positionalOnly = true
      continue
    }
    if (!positionalOnly && (arg === '--help' || arg === '-h')) return { cmd: 'help' }
    if (!positionalOnly && arg.startsWith('--')) {
      const name = arg.slice(2)
      if (!['in', 'limit', 'up', 'json'].includes(name)) {
        failWith(`unknown flag '${arg}' for '${cmd}'\n${USAGE}`, opts.json)
      }
      if (seen.has(name)) failWith(`flag '${arg}' repeated`, opts.json)
      seen.add(name)
      if (name === 'json') {
        opts.json = true
        continue
      }
      const value = rest[++i]
      if (value === undefined || (!positionalOnly && value.startsWith('--'))) {
        failWith(`flag ${arg} needs a value\n${USAGE}`, opts.json)
      }
      try {
        if (name === 'in') opts.in = value
        if (name === 'limit') opts.limit = parseCount(value, '--limit')
        if (name === 'up') opts.up = parseCount(value, '--up')
      } catch (err) {
        if (err instanceof UsageError) failWith(err.message, opts.json)
        throw err
      }
    } else if (cmd === 'search') {
      opts.query.push(arg)
    } else {
      opts.ref.push(arg)
    }
  }
  return { cmd, ...opts }
}

function printHit(hit) {
  const score = hit.score === null ? '' : `${hit.score.toFixed(SCORE_DECIMALS)} `
  const extra = hit.extra ? `  ${hit.extra}` : ''
  console.log(`${score}${hit.collection}:${hit.id} — ${hit.title}${extra}`)
  if (hit.path) console.log(`    ${hit.path}`)
  if (hit.snippet) {
    const fuzzy = hit.fuzzy?.length ? `  [~${hit.fuzzy.join(', ~')}]` : ''
    const matched =
      !hit.fuzzy?.length && hit.matched?.length
        ? `  [matched: ${hit.matched.join(', ')}]`
        : ''
    console.log(`    ${hit.snippet}${fuzzy}${matched}`)
  }
}

function footer(shown, total) {
  if (shown >= total) return `showing ${total}`
  return `showing ${shown} of ${total} (--limit ${total} for all)`
}

function runSearch(all, opts) {
  const query = opts.query.join(' ').trim()
  if (!query && opts.in == null) {
    const rows = collectionTable(all)
    if (opts.json) {
      console.log(JSON.stringify(rows, null, JSON_INDENT))
    } else {
      for (const r of rows) {
        console.log(`${r.name}  [${r.kind}]  ${r.docs} docs\n    ${r.description}`)
      }
    }
    return
  }
  const manifest = opts.in == null ? null : all.manifest(opts.in)
  if (opts.in != null && !manifest) {
    const known = all.manifests.map(m => m.name).join(', ')
    throw new UsageError(`unknown collection '${opts.in}' (known: ${known})`, opts.json)
  }
  if (opts.up !== null) {
    throw new UsageError('--up applies to show <path> only', opts.json)
  }
  const collection = manifest?.name ?? null
  if (!query) {
    const found = roster(all, collection, opts.limit ?? LIST_CAP)
    if (opts.json) {
      console.log(
        JSON.stringify(
          {
            collection,
            total: found.total,
            returned: found.docs.length,
            header: found.header,
            docs: found.docs.map(d => ({
              collection: d.collection,
              id: d.id,
              title: d.title,
              extra: d.extra,
              path: d.path,
            })),
          },
          null,
          JSON_INDENT
        )
      )
    } else {
      if (found.header) {
        console.log(
          `perf-index: ${found.total} entries (built ${found.header.built})\nwaves: ${JSON.stringify(found.header.waves)}\nverdicts: ${JSON.stringify(found.header.verdicts)}`
        )
      }
      for (const d of found.docs) {
        const extra = d.extra ? `  ${d.extra}` : ''
        console.log(`${d.collection}:${d.id} — ${d.title}${extra}`)
      }
      console.log(
        found.total > found.docs.length
          ? `listed ${found.docs.length} of ${found.total} (capped)`
          : `listed ${found.total}`
      )
    }
    return
  }
  const found = search(all, query, {
    collection,
    limit: opts.limit ?? DEFAULT_LIMIT,
  })
  if (opts.json) {
    console.log(
      JSON.stringify(
        { total: found.total, returned: found.hits.length, hits: found.hits },
        null,
        JSON_INDENT
      )
    )
    return
  }
  if (!found.hits.length) {
    const hint =
      collection === 'perf' ? ' (every word must appear — try each word alone)' : ''
    console.log(found.total ? footer(0, found.total) : `no matches for '${query}'${hint}`)
    return
  }
  for (const hit of found.hits) printHit(hit)
  console.log(footer(found.hits.length, found.total))
}

function showJsonDoc(doc) {
  if (!doc) return {}
  const base = {
    collection: doc.collection,
    id: doc.id,
    title: doc.title,
    path: doc.path,
  }
  const p = doc.payload
  switch (doc.kind) {
    case 'perf': {
      const e = p.entry
      return {
        ...base,
        verdict: e.verdict,
        wave: e.wave,
        kind: e.kind,
        topic: e.topic,
        effect: e.effect,
        report: e.report,
        patch: e.patch,
        files: e.files,
        overruledBy: e.overruledBy ?? null,
        landing: e.landing ?? null,
        landedIn: e.landedIn ?? null,
        summary: e.summary ?? null,
        log: e.log ?? null,
      }
    }
    case 'neo':
      return { ...base, family: p.family, related: p.related, specs: p.specs }
    case 'rs':
      return { ...base, related: p.related, suites: p.suites, caseIds: p.caseIds }
    case 'markdown':
      return { ...base, tags: p.tags, frontmatter: p.frontmatter }
    default:
      return base
  }
}

function runShow(all, opts) {
  if (opts.ref.length !== 1) {
    throw new UsageError('usage: cli.mjs show <id-or-path> [--up N] [--json]', opts.json)
  }
  if (opts.in != null) {
    throw new UsageError(
      'show takes no --in (qualify the id instead: <collection>:<id>)',
      opts.json
    )
  }
  const found = show(all, opts.ref[0], {
    up: opts.up ?? Infinity,
    upExplicit: opts.up !== null,
    root: ROOT,
    candidateLimit: opts.limit ?? CANDIDATE_CAP,
  })
  if (found.misuse) throw new UsageError(found.text, opts.json)
  if (opts.json) {
    if (found.missing) {
      console.log(JSON.stringify({ error: found.text }, null, JSON_INDENT))
      process.exit(EXIT_NOT_FOUND)
    }
    if (found.ambiguous) {
      console.log(
        JSON.stringify(
          { ref: opts.ref[0], candidates: found.candidates },
          null,
          JSON_INDENT
        )
      )
      process.exit(EXIT_NOT_FOUND)
    }
    console.log(
      JSON.stringify(
        { ref: opts.ref[0], text: found.text ?? null, ...showJsonDoc(found.doc) },
        null,
        JSON_INDENT
      )
    )
    return
  }
  if (found.missing || found.ambiguous) {
    console.error(found.text)
    process.exit(EXIT_NOT_FOUND)
  }
  console.log(found.text)
}

function main(argv) {
  const opts = parseArgs(argv)
  if (opts.cmd === 'help') {
    console.log(USAGE)
    return
  }
  let manifests
  try {
    manifests = loadManifests()
  } catch (err) {
    fail(`cannot load ${COLLECTIONS_DIR}: ${err.message}`, opts.json)
  }
  const all = loadAll(manifests)
  for (const warning of all.warnings) console.error(`warn: ${warning}`)
  if (opts.cmd === 'search') runSearch(all, opts)
  else runShow(all, opts)
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (invokedDirectly) {
  try {
    main(process.argv.slice(2))
  } catch (err) {
    if (err instanceof UsageError) fail(err.message, err.json)
    throw err
  }
}
