/**
 * Follows a page's imports into the clone without running any code. Resolves
 * the aliases mantine.dev and help.mantine.dev use (`@docs/demos`,
 * `@docs/styles-api`, `@/` for each app's src), relative paths, and re-exports
 * (`export { x } from`, `export * as NS from`, `export *`), until it reaches the
 * file that declares the name.
 */

import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

/** Packages the docs import from the clone, by their entry file (relative to the clone). */
const PACKAGE_ENTRY = {
  '@docs/demos': 'packages/@docs/demos/src/index',
  '@docs/styles-api': 'packages/@docs/styles-api/src/index',
}

const IMPORT = /^import\s+([^;'"]*?)\s+from\s+(['"])([^'"\n]+)\2/gm
const REEXPORT_NAMED = /^export\s+\{([\s\S]*?)\}\s+from\s+(['"])([^'"\n]+)\2/gm
const REEXPORT_NAMESPACE = /^export\s+\*\s+as\s+([\w$]+)\s+from\s+(['"])([^'"\n]+)\2/gm
const REEXPORT_STAR = /^export\s+\*\s+from\s+(['"])([^'"\n]+)\1/gm
const LOCAL_EXPORT = /^export\s+(?:default\s+)?(?:async\s+)?(?:const|let|var|function\*?|class)\s+([\w$]+)/gm

const cache = new Map()

/** Text of a clone file, read once. */
export function readClone(file) {
  if (!cache.has(file)) cache.set(file, readFileSync(file, 'utf8').replace(/\r\n/g, '\n'))
  return cache.get(file)
}

/** The file text with fenced code blanked, so imports shown in examples are ignored. */
function outsideFences(text) {
  const lines = text.split('\n')
  let fence = null
  return lines
    .map(line => {
      const m = line.match(/^\s*(`{3,}|~{3,})/)
      if (fence) {
        if (m && m[1][0] === fence[0] && m[1].length >= fence.length && line.trim() === m[1]) fence = null
        return ''
      }
      if (m) {
        fence = m[1]
        return ''
      }
      return line
    })
    .join('\n')
}

const importsCache = new Map()
const exportsCache = new Map()

/** Local name -> { spec, imported } for a page or module. `imported` is a name, 'default', or '*'. */
export function importsOf(file) {
  if (importsCache.has(file)) return importsCache.get(file)
  const map = new Map()
  for (const m of outsideFences(readClone(file)).matchAll(IMPORT)) {
    const clause = m[1].trim()
    const spec = m[3]
    if (clause.startsWith('type ')) continue
    let rest = clause
    const named = rest.match(/\{([\s\S]*?)\}/)
    if (named) {
      for (const part of named[1].split(',')) {
        const t = part.trim()
        if (!t || t.startsWith('type ')) continue
        const am = t.match(/^([\w$]+)(?:\s+as\s+([\w$]+))?$/)
        if (am) map.set(am[2] ?? am[1], { spec, imported: am[1] })
      }
      rest = rest.replace(named[0], '')
    }
    const ns = rest.match(/\*\s+as\s+([\w$]+)/)
    if (ns) {
      map.set(ns[1], { spec, imported: '*' })
      rest = rest.replace(ns[0], '')
    }
    rest = rest.replace(/,/g, '').trim()
    if (/^[\w$]+$/.test(rest)) map.set(rest, { spec, imported: 'default' })
  }
  importsCache.set(file, map)
  return map
}

/** Named, namespace and star re-exports, and the names a module declares itself. */
function exportsOf(file) {
  if (exportsCache.has(file)) return exportsCache.get(file)
  const text = outsideFences(readClone(file))
  const named = new Map()
  const namespaces = new Map()
  const stars = []
  const locals = new Set()
  for (const m of text.matchAll(REEXPORT_NAMED)) {
    for (const part of m[1].split(',')) {
      const t = part.trim()
      if (!t || t.startsWith('type ')) continue
      const am = t.match(/^([\w$]+)(?:\s+as\s+([\w$]+))?$/)
      if (am) named.set(am[2] ?? am[1], { spec: m[3], imported: am[1] })
    }
  }
  for (const m of text.matchAll(REEXPORT_NAMESPACE)) namespaces.set(m[1], m[3])
  for (const m of text.matchAll(REEXPORT_STAR)) stars.push(m[2])
  for (const m of text.matchAll(LOCAL_EXPORT)) locals.add(m[1])
  const out = { named, namespaces, stars, locals }
  exportsCache.set(file, out)
  return out
}

/** A file path for an import specifier from `fromFile`, or null when it is not in the clone. */
export function resolveSpec(clone, fromFile, spec) {
  let base
  if (spec.startsWith('.')) base = resolve(dirname(fromFile), spec)
  else if (PACKAGE_ENTRY[spec]) base = join(clone, PACKAGE_ENTRY[spec])
  else if (spec.startsWith('@/')) {
    const app = ['apps/help.mantine.dev', 'apps/mantine.dev'].find(dir => fromFile.startsWith(join(clone, dir) + '/'))
    if (!app) return null
    base = join(clone, app, 'src', spec.slice(2))
  } else return null
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}.mjs`, join(base, 'index.ts'), join(base, 'index.tsx')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  return null
}

/**
 * Where a name is declared: { file, name } for a declaration, { namespace } for
 * `export * as NS`, or null. Follows named and star re-exports.
 */
export function bindingOf(clone, file, name, depth = 0) {
  if (depth > 12) return null
  const ex = exportsOf(file)
  if (ex.named.has(name)) {
    const { spec, imported } = ex.named.get(name)
    const target = resolveSpec(clone, file, spec)
    return target ? bindingOf(clone, target, imported, depth + 1) : null
  }
  if (ex.namespaces.has(name)) {
    const target = resolveSpec(clone, file, ex.namespaces.get(name))
    return target ? { namespace: target } : null
  }
  if (ex.locals.has(name)) return { file, name }
  for (const spec of ex.stars) {
    const target = resolveSpec(clone, file, spec)
    const hit = target ? bindingOf(clone, target, name, depth + 1) : null
    if (hit) return hit
  }
  return null
}

/**
 * Resolves an expression such as `ButtonDemos.configurator` or `TabsBorderColor`
 * used in a page to { file, name, rest }: the declaring file, the declared name,
 * and any member names after it. Null when it is not imported from the clone.
 */
export function resolveExpression(clone, pageFile, expr) {
  const [head, ...rest] = expr.split('.')
  const bind = importsOf(pageFile).get(head)
  if (!bind) return null
  const target = resolveSpec(clone, pageFile, bind.spec)
  if (!target) return null
  let hit
  if (bind.imported === '*') hit = { namespace: target }
  else if (bind.imported === 'default') hit = bindingOf(clone, target, 'default')
  else hit = bindingOf(clone, target, bind.imported)
  if (!hit) return null
  if (hit.namespace) {
    if (rest.length === 0) return null
    const member = bindingOf(clone, hit.namespace, rest[0])
    if (!member || member.namespace) return null
    return { file: member.file, name: member.name, rest: rest.slice(1) }
  }
  return { file: hit.file, name: hit.name, rest }
}

/** The import specifier a page uses for a local name (for example the file behind an image import). */
export function specOf(pageFile, localName) {
  return importsOf(pageFile).get(localName)?.spec ?? null
}
