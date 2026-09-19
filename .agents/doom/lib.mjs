/**
 * Doom log index + search (pure logic; no CLI side effects).
 *
 * Reads `.agents/doom/logs/*.md` hunt reports, indexes them with
 * minisearch, and answers ranked queries. The CLI re-indexes from
 * scratch on every call, so there is no stale state to manage.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import MiniSearch from 'minisearch'

export const DEFAULT_LIMIT = 5
export const SEARCH_COMMAND = 'search'
export const INDEX_COMMAND = 'index'
export const UNKNOWN_FIELD = '?'
export const SNIPPET_MAX_LENGTH = 220

export class UsageError extends Error {}

const LIMIT_FLAG = '--limit'
const JSON_FLAG = '--json'
const REPORT_EXT = '.md'
const MIN_SNIPPET_LINE_LENGTH = 2
const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---\n?/
const FIELD_PATTERN = /^([a-z_]+):\s*(.*)$/
const TITLE_PATTERN = /^#\s+(.+)$/m
const HYPOTHESIS_PATTERN = /^## Hypothesis\s*$/m
const SECTION_PATTERN = /^## /m
const KNOWN_FIELDS = new Set([
  'title',
  'module',
  'brief',
  'verdict',
  'break',
  'date',
  'cycle',
])
const SEARCH_FIELDS = ['title', 'module', 'brief', 'hypothesis', 'verdict', 'break', 'body']
const STORED_FIELDS = ['title', 'module', 'verdict', 'date', 'cycle']
const FIELD_BOOSTS = { title: 3, module: 2, verdict: 2 }
const FUZZY_FRACTION = 0.2

function unquote(value) {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1)
  }
  return value
}

function parseFrontmatter(raw) {
  const match = raw.match(FRONTMATTER_PATTERN)
  if (!match) return { fields: {}, body: raw }
  const fields = {}
  for (const line of match[1].split('\n')) {
    const field = line.match(FIELD_PATTERN)
    if (field && KNOWN_FIELDS.has(field[1])) fields[field[1]] = unquote(field[2].trim())
  }
  return { fields, body: raw.slice(match[0].length) }
}

function extractTitle(body) {
  return body.match(TITLE_PATTERN)?.[1].trim() ?? null
}

function extractHypothesis(body) {
  const start = body.match(HYPOTHESIS_PATTERN)
  if (!start) return ''
  const rest = body.slice(start.index + start[0].length)
  const next = rest.match(SECTION_PATTERN)
  return (next ? rest.slice(0, next.index) : rest).trim()
}

/** Parse one report file into an indexable doc. */
export function parseLog(filename, raw) {
  const { fields, body } = parseFrontmatter(raw)
  return {
    ...fields,
    id: filename,
    title: extractTitle(body) ?? fields.title ?? filename,
    body: body.replace(TITLE_PATTERN, '').trim(),
    hypothesis: extractHypothesis(body),
  }
}

function isReport(filename) {
  return filename.endsWith(REPORT_EXT)
}

function readReport(logsDir, filename) {
  return parseLog(filename, readFileSync(join(logsDir, filename), 'utf8'))
}

/** Load every report in a logs dir (skips non-markdown). */
export function loadDocs(logsDir) {
  return readdirSync(logsDir)
    .filter(isReport)
    .map(filename => readReport(logsDir, filename))
}

/** Build a fresh fuzzy index over docs. */
export function buildIndex(docs) {
  const mini = new MiniSearch({
    fields: SEARCH_FIELDS,
    storeFields: STORED_FIELDS,
    searchOptions: { prefix: true, fuzzy: FUZZY_FRACTION, boost: FIELD_BOOSTS },
  })
  mini.addAll(docs)
  return mini
}

/** First body line matching any term, else the first line (capped). */
export function snippet(body, terms) {
  const lines = body
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length >= MIN_SNIPPET_LINE_LENGTH)
  const needles = terms.map(term => term.toLowerCase())
  const hit = lines.find(line => {
    const lower = line.toLowerCase()
    return needles.some(needle => lower.includes(needle))
  })
  return (hit ?? lines[0] ?? '').slice(0, SNIPPET_MAX_LENGTH)
}

function toHit(doc, hit, terms) {
  return {
    id: hit.id,
    title: hit.title,
    module: hit.module || UNKNOWN_FIELD,
    verdict: hit.verdict ?? '',
    score: hit.score,
    snippet: snippet(doc.body, terms),
  }
}

/** Ranked search; each hit carries display fields + snippet. */
export function searchDocs(docs, query, limit = DEFAULT_LIMIT) {
  const mini = buildIndex(docs)
  const byId = new Map(docs.map(doc => [doc.id, doc]))
  const terms = query.split(/\s+/)
  return mini
    .search(query)
    .slice(0, limit)
    .map(hit => toHit(byId.get(hit.id), hit, terms))
}

function parseLimit(value) {
  const limit = Number.parseInt(value, 10)
  return Number.isNaN(limit) ? DEFAULT_LIMIT : limit
}

function parseSearch(rest) {
  const words = []
  let limit = DEFAULT_LIMIT
  let json = false
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i]
    if (arg === LIMIT_FLAG) {
      limit = parseLimit(rest[i + 1])
      i++
    } else if (arg === JSON_FLAG) {
      json = true
    } else if (!arg.startsWith('--')) {
      words.push(arg)
    }
  }
  const query = words.join(' ').trim()
  if (!query) throw new UsageError()
  return { cmd: SEARCH_COMMAND, query, limit, json }
}

/** Parse CLI args; throws UsageError on misuse. */
export function parseArgs(argv) {
  const [cmd, ...rest] = argv
  if (cmd === INDEX_COMMAND && rest.length === 0) return { cmd }
  if (cmd === SEARCH_COMMAND) return parseSearch(rest)
  throw new UsageError()
}
