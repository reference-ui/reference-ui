/**
 * Memex collection adapters: one doc model per kind, no code per collection.
 *
 * `markdown` reads .md files (optional frontmatter, everything kept) plus
 * small .json sidecars (flattened). `neo` and `rs` port the case-index
 * collectors verbatim: one doc per case / per module. `rs-case` gives each
 * reference-rs case folder its own doc, keyed by the id in its case.json.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, join, relative } from 'node:path'
import { extractTitle, firstParagraph, parseFrontmatter, parseTags } from './text.mjs'

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'target', 'build'])
// Any case-id shape (NEO-, ATM-, ATL-, STT-, TST-, ...), so a cited id links as related.
const ID_PATTERN = /\b([A-Z]{2,4}-[A-Z]{2,}-\d+|rs:[a-z-]+)\b/g
const NEO_CASES_SUBDIR = 'cases'
const RS_CASES_PATH = ['tests', 'cases']
const CASE_INDEX_FILE = 'case.json'

export function inferRelated(markdown, selfId) {
  const out = []
  const seen = new Set([selfId])
  for (const m of String(markdown).matchAll(ID_PATTERN)) {
    if (!seen.has(m[1])) {
      seen.add(m[1])
      out.push(m[1])
    }
  }
  return out
}

function segmentMatch(pattern, name) {
  if (pattern === '*') return true
  if (!pattern.includes('*')) return pattern === name
  const parts = pattern.split('*')
  let rest = name
  if (!rest.startsWith(parts[0])) return false
  rest = rest.slice(parts[0].length)
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i]
    if (i === parts.length - 1) return rest.endsWith(part)
    const idx = rest.indexOf(part)
    if (idx === -1) return false
    rest = rest.slice(idx + part.length)
  }
  return true
}

/** Tiny glob: single stars stay in one segment, a leading doublestar spans depth. */
export function matchGlob(pattern, relpath) {
  const patSegs = pattern.split('/')
  const pathSegs = relpath.split('/')
  function match(pi, si) {
    if (pi === patSegs.length) return si === pathSegs.length
    if (patSegs[pi] === '**') {
      for (let k = si; k <= pathSegs.length; k++) {
        if (match(pi + 1, k)) return true
      }
      return false
    }
    if (si === pathSegs.length) return false
    return segmentMatch(patSegs[pi], pathSegs[si]) && match(pi + 1, si + 1)
  }
  return match(0, 0)
}

function walkFiles(dir, out = []) {
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) walkFiles(full, out)
    } else {
      out.push(full)
    }
  }
  return out
}

function flattenJson(value, prefix, lines) {
  if (value === null || value === undefined) return
  if (Array.isArray(value)) {
    for (const v of value) flattenJson(v, prefix, lines)
    return
  }
  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      flattenJson(v, prefix ? `${prefix}.${k}` : k, lines)
    }
    return
  }
  lines.push(prefix ? `${prefix}: ${value}` : String(value))
}

function parseMarkdownDoc(abs, rel, id) {
  const raw = readFileSync(abs, 'utf8')
  if (raw.includes('\0')) return null
  const { fields, body } = parseFrontmatter(raw)
  const tags = parseTags(fields.tags)
  const title = extractTitle(body) ?? fields.title ?? id
  return {
    id,
    title,
    tags,
    body: body.replace(/^#\s+.+$/m, '').trim(),
    extraFields: fields,
    path: rel,
    raw,
  }
}

function parseJsonDoc(abs, rel, id) {
  let data
  try {
    data = JSON.parse(readFileSync(abs, 'utf8'))
  } catch {
    return null
  }
  const lines = []
  flattenJson(data, '', lines)
  const top = data && typeof data === 'object' && !Array.isArray(data) ? data : {}
  const scalar = v =>
    typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
      ? String(v)
      : null
  const extraFields = {}
  for (const [k, v] of Object.entries(top)) {
    const s = scalar(v)
    if (s !== null) extraFields[k] = s
  }
  return {
    id,
    title: extraFields.title ?? extraFields.name ?? extraFields.id ?? id,
    tags: [],
    body: lines.join('\n'),
    extraFields,
    path: rel,
    raw: readFileSync(abs, 'utf8'),
  }
}

/** Collect one `markdown` root: .md plus generic .json sidecars. */
export function collectMarkdown(root, manifest) {
  const docs = []
  const warnings = []
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    return { docs, warnings: [`root missing: ${root}`] }
  }
  for (const abs of walkFiles(root)) {
    const rel = relative(root, abs)
    if (!manifest.include.some(p => matchGlob(p, rel))) continue
    const id = manifest.id === 'basename' ? basename(abs) : rel
    const parsed = abs.endsWith('.json')
      ? parseJsonDoc(abs, rel, id)
      : abs.endsWith('.md') || abs.endsWith('.markdown')
        ? parseMarkdownDoc(abs, rel, id)
        : null
    if (!parsed) {
      warnings.push(`skipped (unparseable): ${rel}`)
      continue
    }
    const mv = [parsed.extraFields.module, parsed.extraFields.verdict].filter(Boolean)
    docs.push({
      collection: manifest.name,
      kind: manifest.kind,
      id: parsed.id,
      title: parsed.title,
      extra: mv.length ? `[${mv.join(' · ')}]` : '',
      path: parsed.path,
      snippetText: parsed.body,
      fields: {
        ...parsed.extraFields,
        id: parsed.id,
        title: parsed.title,
        tags: parsed.tags.join(' '),
        body: parsed.body,
      },
      payload: { raw: parsed.raw, tags: parsed.tags, frontmatter: parsed.extraFields },
    })
  }
  return { docs, warnings }
}

const NEO_SKIP_DIRS = new Set(['node_modules', 'world', 'dist', 'target', '.git'])

function findCaseJsonFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (NEO_SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) findCaseJsonFiles(full, out)
    else if (entry === 'case.json') out.push(full)
  }
  return out
}

function findSpecFiles(specsDir, out = []) {
  if (!existsSync(specsDir)) return out
  const stack = [specsDir]
  while (stack.length) {
    const dir = stack.pop()
    for (const entry of readdirSync(dir).sort()) {
      if (entry === 'node_modules' || entry === 'world') continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) stack.push(full)
      else if (entry.endsWith('.spec.ts')) out.push(full)
    }
  }
  return out.sort()
}

/** One doc per neo case: case.json meta + README + authorial specs. */
export function collectNeo(casesDir, root, name) {
  const docs = []
  const files = findCaseJsonFiles(casesDir).sort()
  for (const casePath of files) {
    const dir = dirname(casePath)
    let meta = {}
    try {
      meta = JSON.parse(readFileSync(casePath, 'utf8'))
    } catch {
      continue
    }
    if (!meta.id) continue
    const readmePath = join(dir, 'README.md')
    const readme = existsSync(readmePath) ? readFileSync(readmePath, 'utf8') : ''
    const specFiles = findSpecFiles(join(dir, 'specs'))
    const specs = specFiles
      .map(f => `spec ${relative(dir, f)}:\n${readFileSync(f, 'utf8')}`)
      .join('\n')
    const family = relative(casesDir, dir).split('/')[0]
    docs.push({
      collection: name,
      kind: 'neo',
      id: meta.id,
      title: meta.name || meta.id,
      extra: family,
      path: relative(root, dir),
      snippetText: `${meta.name || ''}\n${readme}`,
      fields: {
        id: meta.id,
        title: meta.name || meta.id,
        text: `${meta.id} ${meta.name || ''}\n${readme}\n${specs}`,
        inventory: '',
      },
      payload: {
        readme,
        related: inferRelated(readme, meta.id),
        specs: specFiles.map(f => relative(root, f)),
        family,
      },
    })
  }
  return { docs, warnings: [] }
}

function walkSuites(moduleDir, testsDir) {
  const suites = []
  const stack = [moduleDir]
  const casesDir = join(testsDir, NEO_CASES_SUBDIR)
  while (stack.length) {
    const dir = stack.pop()
    if (dir === casesDir) continue
    for (const entry of readdirSync(dir).sort()) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        if (!SKIP_DIRS.has(entry)) stack.push(full)
      } else if (entry.endsWith('.test.ts') || entry.endsWith('.test.tsx')) {
        suites.push(full)
      }
    }
  }
  return suites.sort()
}

function inventoryCases(testsDir) {
  const ids = []
  const caseDirs = join(testsDir, 'cases')
  if (existsSync(caseDirs) && statSync(caseDirs).isDirectory()) {
    for (const e of readdirSync(caseDirs).sort()) {
      if (statSync(join(caseDirs, e)).isDirectory()) ids.push(e)
    }
  }
  const goldens = join(testsDir, 'goldens')
  if (existsSync(goldens) && statSync(goldens).isDirectory()) {
    for (const e of readdirSync(goldens).sort()) {
      const full = join(goldens, e)
      if (!statSync(full).isDirectory()) ids.push(e.replace(/\.[^.]+(\.[^.]+)?$/, ''))
    }
  }
  return ids
}

/** One doc per RS module: README prose plus suite/case inventory. */
export function collectRs(modulesDir, root, name) {
  const docs = []
  for (const mod of readdirSync(modulesDir).sort()) {
    const dir = join(modulesDir, mod)
    if (!statSync(dir).isDirectory()) continue
    const readmePath = join(dir, 'README.md')
    const readme = existsSync(readmePath) ? readFileSync(readmePath, 'utf8') : ''
    const testsDir = join(dir, 'tests')
    const suites = walkSuites(dir, testsDir).map(s => relative(dir, s))
    const caseIds = inventoryCases(testsDir)
    const heading = readme.match(/^#\s+(.+)/m)?.[1].trim() || mod
    docs.push({
      collection: name,
      kind: 'rs',
      id: `rs:${mod}`,
      title: heading,
      extra: `${suites.length} suites, ${caseIds.length} cases`,
      path: relative(root, dir),
      snippetText: `${heading}\n${readme}`,
      fields: {
        id: `rs:${mod}`,
        title: heading,
        text: readme,
        inventory: [
          `suites: ${suites.join(' ')}`,
          `cases(${caseIds.length}): ${caseIds.join(' ')}`,
        ].join('\n'),
      },
      payload: {
        readme,
        related: inferRelated(readme, `rs:${mod}`),
        suites,
        caseIds,
      },
    })
  }
  return { docs, warnings: [] }
}

function isDirectory(path) {
  return existsSync(path) && statSync(path).isDirectory()
}

/** Read a case folder's case.json; a warning names what is wrong with it. */
function readCaseMeta(file) {
  if (!existsSync(file)) return { warning: 'no case.json' }
  let meta
  try {
    meta = JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return { warning: 'unparseable case.json' }
  }
  return meta?.id ? { meta } : { warning: 'case.json has no id' }
}

/**
 * One doc per reference-rs case folder: case.json meta + README + spec.ts.
 * A folder whose case.json is missing or unreadable is skipped with a
 * warning; the case runner fails those folders, so this only shows
 * while a case is being written.
 */
export function collectRsCases(modulesDir, root, name) {
  const docs = []
  const warnings = []
  for (const mod of readdirSync(modulesDir).sort()) {
    const casesDir = join(modulesDir, mod, ...RS_CASES_PATH)
    if (!isDirectory(casesDir)) continue
    for (const folder of readdirSync(casesDir).sort()) {
      const dir = join(casesDir, folder)
      if (!isDirectory(dir)) continue
      const { meta, warning } = readCaseMeta(join(dir, CASE_INDEX_FILE))
      if (warning) {
        warnings.push(`skipped (${warning}): ${relative(root, dir)}`)
        continue
      }
      docs.push(rsCaseDoc(meta, { dir, mod, root, name }))
    }
  }
  return { docs, warnings }
}

function rsCaseDoc(meta, { dir, mod, root, name }) {
  const id = String(meta.id)
  const readmePath = join(dir, 'README.md')
  const readme = existsSync(readmePath) ? readFileSync(readmePath, 'utf8') : ''
  const specPath = join(dir, 'spec.ts')
  const hasSpec = existsSync(specPath)
  const spec = hasSpec ? readFileSync(specPath, 'utf8') : ''
  const title = typeof meta.name === 'string' && meta.name ? meta.name : id
  return {
    collection: name,
    kind: 'rs-case',
    id,
    title,
    extra: mod,
    path: relative(root, dir),
    snippetText: `${title}\n${readme}`,
    fields: {
      id,
      title,
      text: `${id} ${title}\n${readme}\nspec.ts:\n${spec}`,
    },
    payload: {
      readme,
      related: inferRelated(readme, id),
      specs: hasSpec ? [relative(root, specPath)] : [],
      module: mod,
    },
  }
}
