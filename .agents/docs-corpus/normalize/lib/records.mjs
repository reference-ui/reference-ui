/**
 * Writes the records file that the memex CLI reads for the docs-corpus collection.
 * Takes the finished _normalized tree, reads each page and section file's
 * frontmatter and body, and emits _normalized/docs-corpus.json as
 * `{ "docs": [...] }`, one flat object per file: string fields only, so every
 * field is a memex search field and `source:panda` style filters work. The
 * manifest at .memex/collections/docs-corpus.json points at this file.
 */
import { readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parseFrontmatter } from './frontmatter.mjs'

export const RECORDS = 'docs-corpus.json'
const FIELDS = ['id', 'title', 'heading', 'description', 'concepts', 'section', 'source', 'type', 'page']

function markdownFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...markdownFiles(full))
    else if (entry.name.endsWith('.md')) files.push(full)
  }
  return files
}

/** One memex record from a normalized file's text; null when it has no id. */
export function recordOf(text, path) {
  const { data, body } = parseFrontmatter(text)
  if (!data.id) return null
  const record = {}
  for (const field of FIELDS) {
    // Inline lists (`[a, b]`) become space-separated words for the index.
    const raw = data[field] ?? ''
    const list = raw.match(/^\[(.*)\]$/)
    const value = list ? list[1].split(/,\s*/).join(' ') : raw
    if (value) record[field] = value
  }
  record.file = path
  record.body = body.trim()
  return record
}

/** Rebuilds `<out>/docs-corpus.json` from every source folder under `out`; returns its path and count. */
export function writeRecords(out, repo) {
  const docs = []
  for (const entry of readdirSync(out, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue
    for (const file of markdownFiles(join(out, entry.name)).sort()) {
      const record = recordOf(readFileSync(file, 'utf8'), relative(repo, file))
      if (record) docs.push(record)
    }
  }
  const target = join(out, RECORDS)
  const tmp = `${target}.${process.pid}.tmp`
  writeFileSync(tmp, JSON.stringify({ docs }))
  renameSync(tmp, target)
  return { file: target, count: docs.length }
}
