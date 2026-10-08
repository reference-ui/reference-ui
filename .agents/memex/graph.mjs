/**
 * Memex graph: the system collection, built in, no manifest to configure.
 *
 * Every README.md plus every file-top header comment (`//!`, `//`, `/**`,
 * `#`) is one doc, harvested from convention rather than configuration.
 * `show <path>` walks the graph neighborhood: the file's own header plus
 * each ancestor directory's README, depth-capped by --up.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, join, relative } from 'node:path'
import { extractTitle } from './text.mjs'

export const GRAPH_NAME = 'graph'
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'target',
  'dist',
  'build',
  'vendor',
  '.cache',
  '__pycache__',
  '.next',
  'out',
  '.turbo',
  'coverage',
  '.venv',
])
const CODE_EXTS = new Set([
  '.rs',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.sh',
])
const HEAD_BYTES = 8192
const HEAD_MAX_LINES = 30
const HEAD_MAX_CHARS = 2000

function isReadme(name) {
  return name.toLowerCase() === 'readme.md'
}

function isCode(name) {
  const dot = name.lastIndexOf('.')
  return dot !== -1 && CODE_EXTS.has(name.slice(dot).toLowerCase())
}

function lineCommented(line) {
  const t = line.trim()
  return t.startsWith('//') || t.startsWith('#')
}

/** Leading comment block: optional shebang, then block or line comments. */
export function extractHeader(head) {
  const lines = head.split('\n')
  let i = 0
  if (lines[0]?.startsWith('#!')) i++
  while (i < lines.length && !lines[i].trim()) i++
  if (i >= lines.length) return null
  const first = lines[i].trim()
  if (first.startsWith('/*')) {
    const out = []
    for (; i < lines.length && out.length < HEAD_MAX_LINES; i++) {
      out.push(lines[i])
      if (lines[i].includes('*/')) break
    }
    return cleanHeader(out.join('\n'))
  }
  if (!lineCommented(lines[i])) return null
  const out = []
  for (; i < lines.length && out.length < HEAD_MAX_LINES; i++) {
    if (!lineCommented(lines[i]) && lines[i].trim()) break
    out.push(lines[i])
  }
  return cleanHeader(out.join('\n'))
}

function cleanHeader(raw) {
  const text = raw
    .split('\n')
    .map(line => {
      const t = line.trim()
      return t
        .replace(/^\/\*+\s?/, '')
        .replace(/\s?\*+\/$/, '')
        .replace(/^\*\s?/, '')
        .replace(/^\/\/!?\s?/, '')
        .replace(/^#\s?/, '')
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (!text) return null
  return text.slice(0, HEAD_MAX_CHARS)
}

function readHead(abs) {
  const fd = readFileSync(abs, 'utf8')
  if (fd.includes('\0')) return null
  return fd.slice(0, HEAD_BYTES)
}

function skipDir(entry) {
  if (entry === '.agents') return false
  if (entry.startsWith('.')) return true
  return SKIP_DIRS.has(entry)
}

function walkRepo(dir, root, docs) {
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (!skipDir(entry)) walkRepo(full, root, docs)
      continue
    }
    const rel = relative(root, full)
    if (isReadme(entry)) {
      const raw = readFileSync(full, 'utf8')
      if (raw.includes('\0')) continue
      docs.push({
        collection: GRAPH_NAME,
        kind: GRAPH_NAME,
        id: rel,
        title: extractTitle(raw) ?? rel,
        extra: 'readme',
        path: rel,
        snippetText: raw,
        fields: { id: rel, title: extractTitle(raw) ?? rel, text: raw },
        payload: { raw },
      })
    } else if (isCode(entry)) {
      const head = readHead(full)
      if (head === null) continue
      const header = extractHeader(head)
      if (!header) continue
      docs.push({
        collection: GRAPH_NAME,
        kind: GRAPH_NAME,
        id: rel,
        title: `${basename(full)} — ${header.split('\n')[0].slice(0, 80)}`,
        extra: 'header',
        path: rel,
        snippetText: header,
        fields: { id: rel, title: basename(full), text: header },
        payload: { raw: header },
      })
    }
  }
  return docs
}

/** Every README + every file header in the repo, minus deps/build/VCS. */
export function collectGraph(root) {
  return { docs: walkRepo(root, root, []), warnings: [] }
}

function isMarkdown(name) {
  return name.toLowerCase().endsWith('.md') || name.toLowerCase().endsWith('.markdown')
}

/** Ancestor READMEs from the file's dir up to (not past) root. */
export function readmeChain(root, absFile) {
  const chain = []
  const seen = new Set()
  let dir = statSync(absFile).isDirectory() ? absFile : dirname(absFile)
  while (dir === root || dir.startsWith(`${root}/`)) {
    for (const name of ['README.md', 'readme.md']) {
      const candidate = join(dir, name)
      const key = candidate.toLowerCase()
      if (existsSync(candidate) && !seen.has(key)) {
        seen.add(key)
        chain.push(candidate)
      }
    }
    if (dir === root) break
    dir = dirname(dir)
  }
  return chain
}

/** The graph neighborhood: own header/content plus ancestor READMEs. */
export function chainShow(root, absFile, up) {
  const sections = []
  const rel = relative(root, absFile)
  const raw = readFileSync(absFile, 'utf8')
  const head = raw.slice(0, HEAD_BYTES)
  const header = isMarkdown(basename(absFile)) ? raw : extractHeader(head)
  sections.push(`=== ${rel} ===\n${header ?? '(no header comment)'}`)
  const self = absFile.toLowerCase()
  const chain = readmeChain(root, absFile)
    .filter(readme => readme.toLowerCase() !== self)
    .slice(0, up)
  for (const readme of chain) {
    sections.push(`=== ${relative(root, readme)} ===\n${readFileSync(readme, 'utf8')}`)
  }
  return sections.join('\n\n')
}
