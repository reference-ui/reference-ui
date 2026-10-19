#!/usr/bin/env node
/**
 * Normalize vendor/docs sources into one plain-Markdown corpus for Memex.
 *
 *   node .agents/docs-corpus/normalize/normalize.mjs [source...]   (none = every adapter)
 *
 * Each source is built by lib/build.mjs and swapped into _normalized/<source>/
 * whole (lib/write.mjs). Then _normalized/pages.jsonl is rebuilt from the
 * per-source indexes, so runs for different sources can go in parallel.
 * README.md has the adapter contract.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { buildSource, checkCollected } from './lib/build.mjs'
import { REPO, VENDOR } from './lib/paths.mjs'
import { rebuildIndex, writeSource } from './lib/write.mjs'
import { buildIndex, collectCollection, loadManifests } from '../../memex/lib.mjs'
import { writePersistedIndex } from '../../memex/persist.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(VENDOR, '_normalized')
const STAGING = join(VENDOR, '_staging')
const CORPUS = 'docs-corpus'

/**
 * The index Memex searches for docs-corpus, rebuilt from the finished tree
 * (see .agents/memex/persist.mjs). Memex falls back to live indexing when
 * this is absent, so a failure here costs speed, not results.
 */
function writeCorpusIndex() {
  const manifest = loadManifests().find(m => m.name === CORPUS)
  if (!manifest?.index) return null
  const { docs } = collectCollection(manifest, REPO)
  const weights = Object.fromEntries(Object.entries(manifest.weights ?? {}))
  const mini = buildIndex(docs, weights, manifest.fields ?? null)
  return writePersistedIndex({ base: resolve(REPO, manifest.index), mini, docs, manifest })
}
const DEMO_EXTENSIONS = ['', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.css']

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

function adapterNames() {
  return readdirSync(join(HERE, 'adapters'))
    .filter(name => name.endsWith('.mjs'))
    .map(name => name.slice(0, -'.mjs'.length))
    .sort()
}

/** Reads an imported demo only from inside the source's clone. */
function readImportWithin(root) {
  return absPath => {
    const rel = relative(root, absPath)
    if (rel.startsWith('..') || resolve(root, rel) !== absPath) return null
    for (const ext of DEMO_EXTENSIONS) {
      const file = `${absPath}${ext}`
      if (existsSync(file) && statSync(file).isFile()) return readFileSync(file, 'utf8')
    }
    return null
  }
}

/** The adapter's default export, plus its `components` hooks (named export or property). */
async function loadAdapter(name) {
  const file = join(HERE, 'adapters', `${name}.mjs`)
  if (!existsSync(file)) throw new Error(`no adapter for '${name}' (expected adapters/${name}.mjs)`)
  const mod = await import(pathToFileURL(file).href)
  const adapter = mod.default
  if (!adapter || typeof adapter.collect !== 'function') {
    throw new Error(`adapters/${name}.mjs: default export needs a collect() function`)
  }
  if (adapter.source !== name) throw new Error(`adapters/${name}.mjs: source must be '${name}'`)
  const components = mod.components ?? adapter.components ?? {}
  for (const [component, hook] of Object.entries(components)) {
    if (typeof hook !== 'function') throw new Error(`adapters/${name}.mjs: components.${component} must be a function`)
  }
  return { adapter, components }
}

async function runSource(name, manifest, vocabulary) {
  const entry = manifest.find(m => m.name === name)
  if (!entry) throw new Error(`'${name}' is not in vendor/docs/manifest.json`)
  const { adapter, components } = await loadAdapter(name)
  const got = await adapter.collect({ vendorDir: VENDOR, entry })
  checkCollected(got, name)
  const built = buildSource({
    name,
    entry,
    pages: got.pages,
    root: got.root,
    siteUrl: got.siteUrl ?? '',
    readImport: readImportWithin(got.root),
    components,
    vocabulary,
  })
  return { ...built, report: got.report ?? [] }
}

function unresolvedText(unresolved) {
  const parts = [...unresolved.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  return {
    total: parts.reduce((sum, [, count]) => sum + count, 0),
    names: parts.map(([name, count]) => `${name} x${count}`).join(', '),
  }
}

/** Per-source summary: pages, sections, unresolved, then a total row. */
function printTable(results) {
  const rows = results.map(r => {
    const unresolved = unresolvedText(r.unresolved)
    return { source: r.name, pages: r.rows.length, sections: r.sections, unresolved: unresolved.total, names: unresolved.names }
  })
  const total = rows.reduce(
    (t, r) => ({ source: 'total', pages: t.pages + r.pages, sections: t.sections + r.sections, unresolved: t.unresolved + r.unresolved, names: '' }),
    { source: 'total', pages: 0, sections: 0, unresolved: 0, names: '' }
  )
  const width = Math.max(6, ...rows.map(r => r.source.length), total.source.length)
  const line = (r, extra = '') => `${r.source.padEnd(width)}  ${String(r.pages).padStart(6)}  ${String(r.sections).padStart(8)}  ${String(r.unresolved).padStart(10)}${extra}`
  console.log('')
  console.log(`${'source'.padEnd(width)}  ${'pages'.padStart(6)}  ${'sections'.padStart(8)}  ${'unresolved'.padStart(10)}`)
  for (const r of rows) console.log(line(r, r.names && r.unresolved ? `  ${r.names}` : ''))
  console.log(line(total))
}

async function main(argv) {
  // stripTypeScriptTypes is experimental in Node 24; its notice is noise here.
  process.removeAllListeners('warning')
  process.on('warning', w => {
    if (w.name !== 'ExperimentalWarning') console.warn(`warn: ${w.message}`)
  })
  const requested = argv.length ? argv : adapterNames()
  const manifest = readJson(join(VENDOR, 'manifest.json'))
  const vocabulary = readJson(join(HERE, 'concepts.json'))
  mkdirSync(OUT, { recursive: true })
  const results = []
  for (const name of requested) {
    const result = await runSource(name, manifest, vocabulary)
    writeSource({ out: OUT, staging: STAGING, name, files: result.files, rows: result.rows })
    results.push(result)
    console.log(`${name}: ${result.rows.length} pages, ${result.sections} sections -> ${relative(process.cwd(), join(OUT, name))}`)
    for (const line of result.report) console.log(`  ${line}`)
  }
  const index = rebuildIndex(OUT)
  printTable(results)
  console.log(`index: ${relative(process.cwd(), join(OUT, 'pages.jsonl'))} (${index.rows} rows from ${index.sources} source indexes)`)
  const corpus = writeCorpusIndex()
  if (corpus) console.log(`search index: ${relative(process.cwd(), corpus.index)} (${corpus.count} docs for ${CORPUS})`)
}

main(process.argv.slice(2)).catch(err => {
  console.error(`normalize: ${err.message}`)
  process.exit(1)
})
