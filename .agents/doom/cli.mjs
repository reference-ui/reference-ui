#!/usr/bin/env node
/**
 * Doom log CLI (thin wrapper; logic lives in lib.mjs).
 *
 *   node .agents/doom/cli.mjs search "<query>" [--limit N] [--json]
 *   node .agents/doom/cli.mjs index
 *
 * Re-indexes from logs/ on every call. DOOM_LOGS_DIR overrides the
 * logs directory (used by tests; default is .agents/doom/logs).
 * Exit codes: 0 success (including no matches), 2 usage error.
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  INDEX_COMMAND,
  loadDocs,
  parseArgs,
  searchDocs,
  UNKNOWN_FIELD,
  UsageError,
} from './lib.mjs'

const USAGE = 'usage: cli.mjs search "<query>" [--limit N] [--json] | cli.mjs index'
const EXIT_USAGE = 2
const LOGS_ENV_VAR = 'DOOM_LOGS_DIR'
const LOGS_DIR_NAME = 'logs'
const SCORE_DECIMALS = 2
const JSON_INDENT = 2

const here = dirname(fileURLToPath(import.meta.url))
const logsDir = process.env[LOGS_ENV_VAR] || join(here, LOGS_DIR_NAME)

function runIndex() {
  const docs = loadDocs(logsDir)
  console.log(`doom log: ${docs.length} report(s) indexed from ${logsDir}`)
  for (const doc of docs) {
    const module = doc.module || UNKNOWN_FIELD
    const verdict = doc.verdict || UNKNOWN_FIELD
    console.log(`  - ${doc.id} [${module}] ${verdict}`)
  }
}

function runSearch({ query, limit, json }) {
  const hits = searchDocs(loadDocs(logsDir), query, limit)
  if (json) {
    console.log(JSON.stringify(hits, null, JSON_INDENT))
    return
  }
  if (hits.length === 0) {
    console.log(`no matches for "${query}"`)
    return
  }
  for (const hit of hits) {
    console.log(`- ${hit.id} (score ${hit.score.toFixed(SCORE_DECIMALS)})`)
    console.log(`  ${hit.title} [${hit.module}] ${hit.verdict}`)
    console.log(`  ${hit.snippet}`)
  }
}

try {
  const args = parseArgs(process.argv.slice(2))
  if (args.cmd === INDEX_COMMAND) runIndex()
  else runSearch(args)
} catch (err) {
  if (!(err instanceof UsageError)) throw err
  console.error(USAGE)
  process.exit(EXIT_USAGE)
}
