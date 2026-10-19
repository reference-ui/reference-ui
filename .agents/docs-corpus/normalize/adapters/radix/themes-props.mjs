/**
 * Prop tables for the Themes docs' ThemesPropsTable, read as text from the
 * radix-ui/themes source clone (vendor/docs/radix/themes-src). A `defs` name
 * resolves through the package's props index (src/props/index.ts): imports,
 * re-exports and `...spread`s are followed, and each prop's `type`, `values`
 * and `default` are read from the source. Types are stripped with node's type
 * stripper and the result is parsed as data; nothing from the source runs.
 * A name that cannot be read statically returns a reason instead of a table,
 * and the adapter keeps a note for it.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { stripTypeScriptTypes } from 'node:module'
import { codeSpan } from './jsx.mjs'

const IDENT = /[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*/y
const NUMBER = /-?\d+(?:\.\d+)?/y
const LITERALS = new Set(['true', 'false', 'null', 'undefined'])
const STATEMENT_START = /(?:const|let|var|export|function|import)\b/y

class Unresolved extends Error {}

function at(re, src, i) {
  re.lastIndex = i
  const m = re.exec(src)
  return m ? m[0] : null
}

/** Skips whitespace and comments. */
function skipSpace(src, start) {
  let i = start
  for (;;) {
    while (i < src.length && /\s/.test(src[i])) i++
    if (src.startsWith('//', i)) {
      const nl = src.indexOf('\n', i)
      i = nl === -1 ? src.length : nl + 1
    } else if (src.startsWith('/*', i)) {
      const end = src.indexOf('*/', i + 2)
      if (end === -1) throw new Unresolved('unclosed comment')
      i = end + 2
    } else return i
  }
}

/** End of the quoted string or template literal that starts at i. */
function skipQuoted(src, i) {
  const quote = src[i]
  let j = i + 1
  while (j < src.length && src[j] !== quote) j += src[j] === '\\' ? 2 : 1
  if (src[j] !== quote) throw new Unresolved('unclosed string')
  return j + 1
}

/** End of the bracket group that opens at i; strings, templates and comments are skipped. */
function skipGroup(src, i) {
  const closers = []
  let j = i
  while (j < src.length) {
    const c = src[j]
    if (c === '"' || c === "'" || c === '`') {
      j = skipQuoted(src, j)
      continue
    }
    if (c === '/' && (src[j + 1] === '/' || src[j + 1] === '*')) {
      j = skipSpace(src, j)
      continue
    }
    if (c === '(' || c === '[' || c === '{') closers.push(c === '(' ? ')' : c === '[' ? ']' : '}')
    else if (c === ')' || c === ']' || c === '}') {
      if (closers.pop() !== c) throw new Unresolved('unbalanced brackets')
      if (closers.length === 0) return j + 1
    }
    j++
  }
  throw new Unresolved('unclosed group')
}

const isTerminator = c => c === ',' || c === ';' || c === '}' || c === ']' || c === ')'

/** End of an expression that the reader does not model: up to a depth-0 terminator. */
function skipToTerminator(src, start) {
  let j = start
  while (j < src.length) {
    j = skipSpace(src, j)
    const c = src[j]
    if (c === undefined || isTerminator(c)) return j
    if (c === '"' || c === "'" || c === '`') j = skipQuoted(src, j)
    else if (c === '(' || c === '[' || c === '{') j = skipGroup(src, j)
    else j++
  }
  return j
}

const unescape = text => text.replace(/\\(.)/g, '$1')

/** Object literal: entries are { key, value } or { spread }; `text` keeps the source. */
function parseObject(src, start) {
  const entries = []
  let j = start + 1
  for (;;) {
    j = skipSpace(src, j)
    if (src[j] === '}') return { node: { kind: 'obj', entries, text: src.slice(start, j + 1) }, end: j + 1 }
    if (src.startsWith('...', j)) {
      const k = skipSpace(src, j + 3)
      const name = at(IDENT, src, k)
      if (name === null) throw new Unresolved('spread of an expression')
      entries.push({ spread: name })
      j = k + name.length
    } else {
      let key
      if (src[j] === '"' || src[j] === "'") {
        const end = skipQuoted(src, j)
        key = unescape(src.slice(j + 1, end - 1))
        j = end
      } else {
        key = at(IDENT, src, j) ?? at(NUMBER, src, j)
        if (key === null) throw new Unresolved('unsupported object key')
        j += key.length
      }
      j = skipSpace(src, j)
      if (src[j] === ':') {
        const v = parseValue(src, j + 1)
        entries.push({ key, value: v.node })
        j = v.end
      } else if (src[j] === ',' || src[j] === '}') {
        entries.push({ key, value: { kind: 'ref', name: key } })
      } else {
        const end = skipToTerminator(src, j)
        entries.push({ key, value: { kind: 'opaque', text: src.slice(j, end).trim() } })
        j = end
      }
    }
    j = skipSpace(src, j)
    if (src[j] === ',') j++
    else if (src[j] !== '}') throw new Unresolved('expected , or } in object')
  }
}

/** Array literal: items are values or { spread }. */
function parseArray(src, start) {
  const items = []
  let j = start + 1
  for (;;) {
    j = skipSpace(src, j)
    if (src[j] === ']') return { node: { kind: 'arr', items, text: src.slice(start, j + 1) }, end: j + 1 }
    if (src.startsWith('...', j)) throw new Unresolved('spread in an array')
    const v = parseValue(src, j)
    items.push(v.node)
    j = skipSpace(src, v.end)
    if (src[j] === ',') j++
    else if (src[j] !== ']') throw new Unresolved('expected , or ] in array')
  }
}

/** One operand: literal, name, object or array. Anything else throws and the caller keeps it opaque. */
function parseOperand(src, i) {
  const c = src[i]
  if (c === '{') return parseObject(src, i)
  if (c === '[') return parseArray(src, i)
  if (c === '"' || c === "'") {
    const end = skipQuoted(src, i)
    return { node: { kind: 'str', value: unescape(src.slice(i + 1, end - 1)) }, end }
  }
  if (c === '`') {
    const end = skipQuoted(src, i)
    const raw = src.slice(i + 1, end - 1)
    if (raw.includes('${')) throw new Unresolved('template with interpolation')
    return { node: { kind: 'str', value: raw }, end }
  }
  const num = at(NUMBER, src, i)
  if (num !== null) return { node: { kind: 'num', text: num }, end: i + num.length }
  const name = at(IDENT, src, i)
  if (name === null) throw new Unresolved('unsupported expression')
  if (LITERALS.has(name)) return { node: { kind: 'lit', text: name }, end: i + name.length }
  return { node: { kind: 'ref', name }, end: i + name.length }
}

/** A value: a modelled operand when a terminator follows it, otherwise the expression kept as source text. */
function parseValue(src, start) {
  const begin = skipSpace(src, start)
  let parsed = null
  try {
    parsed = parseOperand(src, begin)
  } catch (err) {
    if (!(err instanceof Unresolved)) throw err
  }
  if (parsed) {
    const after = skipSpace(src, parsed.end)
    const newline = src.slice(parsed.end, after).includes('\n')
    if (after >= src.length || isTerminator(src[after]) || (newline && at(STATEMENT_START, src, after) !== null)) {
      return { node: parsed.node, end: after }
    }
  }
  const end = skipToTerminator(src, begin)
  return { node: { kind: 'opaque', text: src.slice(begin, end).trim() }, end }
}

/** `{ a, b as c }` as [{ from, to }]. */
function parseNameList(text) {
  const pairs = []
  for (const m of text.matchAll(/([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?/g)) {
    if (m[1] === 'type') continue
    pairs.push({ from: m[1], to: m[2] ?? m[1] })
  }
  return pairs
}

function parseImport(js, start, mod) {
  let j = skipSpace(js, start)
  if (js[j] === '"' || js[j] === "'") return skipQuoted(js, j)
  while (j < js.length) {
    if (js[j] === '{') {
      const end = skipGroup(js, j)
      for (const { from, to } of parseNameList(js.slice(j + 1, end - 1))) {
        mod.imports.set(to, { source: null, name: from, pending: true })
      }
      j = skipSpace(js, end)
      continue
    }
    const word = at(IDENT, js, j)
    if (word === 'from') break
    if (word === '*' || word === null) throw new Unresolved('unsupported import form')
    j = skipSpace(js, j + word.length)
  }
  j = skipSpace(js, j + 4)
  const end = skipQuoted(js, j)
  const source = unescape(js.slice(j + 1, end - 1))
  for (const entry of mod.imports.values()) if (entry.pending) Object.assign(entry, { source, pending: undefined })
  return end
}

function parseExport(js, start, mod) {
  const j = skipSpace(js, start)
  if (js[j] === '*') {
    const k = skipSpace(js, j + 1)
    if (at(IDENT, js, k) !== 'from') throw new Unresolved('unsupported export * form')
    const q = skipSpace(js, k + 4)
    const end = skipQuoted(js, q)
    mod.starFrom.push(unescape(js.slice(q + 1, end - 1)))
    return end
  }
  if (js[j] === '{') {
    const end = skipGroup(js, j)
    const pairs = parseNameList(js.slice(j + 1, end - 1))
    const k = skipSpace(js, end)
    if (at(IDENT, js, k) === 'from') {
      const q = skipSpace(js, k + 4)
      const close = skipQuoted(js, q)
      const source = unescape(js.slice(q + 1, close - 1))
      for (const { from, to } of pairs) mod.exportsFrom.set(to, { source, name: from })
      return close
    }
    for (const { from, to } of pairs) mod.exportsLocal.set(to, from)
    return end
  }
  const keyword = at(IDENT, js, j)
  if (keyword === 'const' || keyword === 'let' || keyword === 'var') {
    return parseDeclarations(js, j + keyword.length, mod, true)
  }
  if (keyword === 'function') return skipFunction(js, j + keyword.length)
  return j + (keyword ? keyword.length : 1)
}

function parseDeclarations(js, start, mod, exported) {
  let j = start
  for (;;) {
    j = skipSpace(js, j)
    const name = at(IDENT, js, j)
    if (name === null) throw new Unresolved('destructuring declaration')
    j = skipSpace(js, j + name.length)
    if (js[j] !== '=') throw new Unresolved(`declaration of ${name} without a value`)
    const v = parseValue(js, j + 1)
    mod.decls.set(name, { node: v.node, exported })
    j = skipSpace(js, v.end)
    if (js[j] === ',') {
      j++
      continue
    }
    return js[j] === ';' ? j + 1 : j
  }
}

function skipFunction(js, start) {
  let j = skipSpace(js, start)
  const name = at(IDENT, js, j)
  if (name !== null) j = skipSpace(js, j + name.length)
  if (js[j] === '(') j = skipGroup(js, j)
  j = skipSpace(js, j)
  if (js[j] === '{') j = skipGroup(js, j)
  return j
}

/** Module facts: declarations, imports, export lists and star re-exports. Types are gone already. */
function parseModule(file) {
  const js = stripTypeScriptTypes(readFileSync(file, 'utf8'))
  const mod = { file, decls: new Map(), imports: new Map(), exportsLocal: new Map(), exportsFrom: new Map(), starFrom: [] }
  let i = 0
  while (i < js.length) {
    i = skipSpace(js, i)
    const c = js[i]
    if (c === undefined) break
    if (c === '"' || c === "'" || c === '`') {
      i = skipQuoted(js, i)
      continue
    }
    if (c === '(' || c === '[' || c === '{') {
      i = skipGroup(js, i)
      continue
    }
    const word = at(IDENT, js, i)
    if (word === null) {
      i++
      continue
    }
    if (word === 'import') i = parseImport(js, i + word.length, mod)
    else if (word === 'export') i = parseExport(js, i + word.length, mod)
    else if (word === 'const' || word === 'let' || word === 'var') i = parseDeclarations(js, i + word.length, mod, false)
    else if (word === 'function') i = skipFunction(js, i + word.length)
    else i += word.length
  }
  return mod
}

/** Module cache: each file is stripped and parsed once per run. */
const modules = new Map()

function loadModule(file) {
  if (!modules.has(file)) modules.set(file, parseModule(file))
  return modules.get(file)
}

/** A relative import as the file it names; `.js` maps to the `.ts`/`.tsx` source. */
function resolveSpec(fromFile, spec) {
  const base = resolve(dirname(fromFile), spec.replace(/\.(js|ts|tsx)$/, ''))
  for (const candidate of [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts')]) {
    if (existsSync(candidate)) return candidate
  }
  throw new Unresolved(`no source file for ${spec}`)
}

/**
 * A dotted reference (`widthPropDefs.width`) walks into the object it names:
 * the head is a top-level binding, each member a property of the object so far.
 */
function findLocal(mod, name) {
  const [head, ...members] = name.split('.')
  let hit = findBinding(mod, head)
  for (const member of members) {
    if (!hit) return null
    hit = collectEntries(objectOf(hit)).get(member) ?? null
  }
  return hit
}

/** A name declared or imported at the top of a module: { node, mod }, or null. */
function findBinding(mod, name) {
  if (mod.decls.has(name)) return { node: mod.decls.get(name).node, mod }
  if (mod.imports.has(name)) {
    const imp = mod.imports.get(name)
    return findExport(loadModule(resolveSpec(mod.file, imp.source)), imp.name, new Set())
  }
  return null
}

/** A name a module exports, following local lists, `export ... from`, and `export *`. */
function findExport(mod, name, seen) {
  const key = `${mod.file}#${name}`
  if (seen.has(key)) return null
  seen.add(key)
  if (mod.exportsFrom.has(name)) {
    const hop = mod.exportsFrom.get(name)
    return findExport(loadModule(resolveSpec(mod.file, hop.source)), hop.name, seen)
  }
  if (mod.exportsLocal.has(name)) return findLocal(mod, mod.exportsLocal.get(name))
  if (mod.decls.has(name) && mod.decls.get(name).exported) return findLocal(mod, name)
  for (const spec of mod.starFrom) {
    const hit = findExport(loadModule(resolveSpec(mod.file, spec)), name, seen)
    if (hit) return hit
  }
  return null
}

/** Follows references until an object literal; returns { node, mod } or throws. */
function objectOf(entry) {
  let current = entry
  for (let hops = 0; hops < 20; hops++) {
    if (current.node.kind === 'obj') return current
    if (current.node.kind !== 'ref') break
    const hit = findLocal(current.mod, current.node.name)
    if (!hit) throw new Unresolved(`${current.node.name} is not defined`)
    current = hit
  }
  throw new Unresolved('value is not an object literal')
}

/** Own entries of an object, with spreads merged in source order (later keys override, first position kept). */
function collectEntries(entry, out = new Map(), depth = 0) {
  if (depth > 20) throw new Unresolved('spread chain too deep')
  const { node, mod } = objectOf(entry)
  for (const item of node.entries) {
    if (item.spread !== undefined) {
      const hit = findLocal(mod, item.spread)
      if (!hit) throw new Unresolved(`spread of ${item.spread} is not defined`)
      collectEntries({ node: hit.node, mod: hit.mod }, out, depth + 1)
    } else {
      out.set(item.key, { node: item.value, mod })
    }
  }
  return out
}

/** A string-valued field, from a literal or a name that resolves to one. */
function stringOf(entry) {
  if (!entry) return undefined
  let current = entry
  for (let hops = 0; hops < 20; hops++) {
    if (current.node.kind === 'str') return current.node.value
    if (current.node.kind !== 'ref') return undefined
    const hit = findLocal(current.mod, current.node.name)
    if (!hit) return undefined
    current = hit
  }
  return undefined
}

/** The enum members of a `values` field, as TypeScript literal types. */
function enumText(valuesEntry, withString) {
  if (!valuesEntry) throw new Unresolved('enum without values')
  let current = valuesEntry
  for (let hops = 0; hops < 20 && current.node.kind === 'ref'; hops++) {
    const hit = findLocal(current.mod, current.node.name)
    if (!hit) throw new Unresolved(`values ${current.node.name} is not defined`)
    current = hit
  }
  if (current.node.kind !== 'arr') throw new Unresolved('values is not an array literal')
  const parts = current.node.items.map(item => {
    if (item.kind === 'str') return JSON.stringify(item.value)
    if (item.kind === 'num') return item.text
    throw new Unresolved('enum member is not a literal')
  })
  if (withString) parts.push('string')
  return parts.join(' | ')
}

/** The default as source shows it: a literal's value, `undefined` as nothing, otherwise the expression text. */
function defaultText(entry) {
  if (!entry) return ''
  let current = entry
  for (let hops = 0; hops < 20 && current.node.kind === 'ref'; hops++) {
    const hit = findLocal(current.mod, current.node.name)
    if (!hit) throw new Unresolved(`default ${current.node.name} is not defined`)
    current = hit
  }
  const { node } = current
  if (node.kind === 'str') return JSON.stringify(node.value)
  if (node.kind === 'num') return node.text
  if (node.kind === 'lit') return node.text === 'undefined' ? '' : node.text
  if (node.kind === 'obj' || node.kind === 'arr' || node.kind === 'opaque') return node.text
  throw new Unresolved('unsupported default')
}

/** A boolean literal set to true (`responsive: true`). */
function isTrue(entry) {
  return entry?.node.kind === 'lit' && entry.node.text === 'true'
}

/** One row per prop: the key, its type (responsive ones wrapped as the site shows them), and its default. */
function propRows(defsEntry) {
  const rows = []
  for (const [prop, entry] of collectEntries(defsEntry)) {
    const def = collectEntries(objectOf(entry))
    const type = stringOf(def.get('type'))
    if (type === undefined) throw new Unresolved(`prop ${prop} has no literal type`)
    const isEnum = type === 'enum' || type === 'enum | string'
    const base = isEnum ? enumText(def.get('values'), type === 'enum | string') : type
    const responsive = isTrue(def.get('responsive'))
    rows.push({
      prop,
      type: responsive ? `Responsive<${base}>` : base,
      default: defaultText(def.get('default')),
    })
  }
  return rows
}

/** The indexed source, read once per source directory: the package's props index. */
function indexFor(srcDir) {
  return loadModule(join(srcDir, 'props', 'index.ts'))
}

/** Rows of one `defs` name, resolved from the props index (the same entry the website's props.ts re-exports). */
function rowsFor(srcDir, defs) {
  const hit = findExport(indexFor(srcDir), defs, new Set())
  if (!hit) throw new Unresolved(`${defs} is not exported by the props index`)
  return propRows({ node: hit.node, mod: hit.mod })
}

function tableMarkdown(rows) {
  const cell = text => codeSpan(text).replace(/\|/g, '\\|')
  const lines = ['| Prop | Type | Default |', '| --- | --- | --- |']
  for (const row of rows) lines.push(`| ${cell(row.prop)} | ${cell(row.type)} | ${cell(row.default)} |`)
  return lines.join('\n')
}

/**
 * The table for one `defs` name: { markdown, rows } when it resolves, or
 * { reason } when it cannot be read statically. Never executes the source.
 */
export function propsTableFor(srcDir, defs) {
  try {
    const rows = rowsFor(srcDir, defs)
    return { markdown: tableMarkdown(rows), rows: rows.length }
  } catch (err) {
    if (err instanceof Unresolved) return { reason: err.message }
    throw err
  }
}
