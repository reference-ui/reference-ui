// Frontmatter reader and contract for the docs gate. It takes an MDX source and emits the
// top-level `key: value` fields with a type for each, plus a line-numbered error for every line
// outside that flat subset of YAML. Content-collections drops a page whose frontmatter does not
// parse, so the reader refuses what it cannot read instead of guessing past it.

const FENCE = /^---[ \t]*$/
const FIELD = /^([A-Za-z_][\w-]*):(?:[ \t]+(.*))?$/
const INT_OR_FLOAT = /^[-+]?\d+(?:\.\d+)?$/
const BOOLEAN = /^(?:true|True|TRUE|false|False|FALSE)$/
const NULL = /^(?:null|Null|NULL|~)$/
// Flow collections, anchors, aliases, tags, block scalars and reserved indicators.
const UNSUPPORTED_START = /^[[{&*!|>%@`,]/
// A sequence entry (`- x`), a complex key (`? x`) or a stray `:` at the start of a value.
const INDICATOR_START = /^[-?:](?:\s|$)/
const CONTRACT = [
  ['title', 'string'],
  ['section', 'string'],
  ['order', 'number'],
  ['slug', 'string'],
  ['description', 'string'],
]

/** Reads a double- or single-quoted scalar; `null` when the closing quote is missing. */
function readQuoted(raw) {
  const quote = raw[0]
  for (let i = 1; i < raw.length; i++) {
    if (quote === '"' && raw[i] === '\\') {
      i++
    } else if (raw[i] === quote) {
      if (quote === "'" && raw[i + 1] === "'") i++
      else return { value: raw.slice(1, i), rest: raw.slice(i + 1) }
    }
  }
  return null
}

/** Reads one value after its key. A comment (` #`) ends a plain value; `#` alone is null. */
export function readScalar(raw) {
  const text = raw.replace(/[ \t]+$/, '')
  if (text === '' || text.startsWith('#')) return { type: 'null', value: null }
  if (text[0] === '"' || text[0] === "'") return readQuotedScalar(text)
  if (UNSUPPORTED_START.test(text)) {
    return {
      error:
        'flow collections, anchors, tags and block scalars are not supported; quote the value',
    }
  }
  if (INDICATOR_START.test(text))
    return { error: 'sequence and complex-key indicators are not supported' }
  const plain = text.replace(/[ \t]+#.*$/, '').replace(/[ \t]+$/, '')
  if (/:(?:\s|$)/.test(plain))
    return { error: 'a colon followed by a space ends the key; quote the value' }
  if (NULL.test(plain)) return { type: 'null', value: null }
  if (BOOLEAN.test(plain)) return { type: 'boolean', value: plain }
  if (INT_OR_FLOAT.test(plain)) return { type: 'number', value: Number(plain) }
  return { type: 'string', value: plain }
}

function readQuotedScalar(text) {
  const quoted = readQuoted(text)
  if (!quoted) return { error: 'the quoted value has no closing quote' }
  if (quoted.rest.trim() !== '' && !quoted.rest.trimStart().startsWith('#')) {
    return { error: 'text follows the closing quote' }
  }
  return { type: 'string', value: quoted.value }
}

/** Parses the leading frontmatter block. Fields keep the line they were read from. */
export function parseFrontmatter(source) {
  const lines = source.replace(/^﻿/, '').split(/\r?\n/)
  const errors = []
  const fields = new Map()
  if (!FENCE.test(lines[0] ?? '')) {
    errors.push({ line: 1, message: 'the page must open with a --- frontmatter block' })
    return { fields, errors, bodyLine: 1 }
  }
  const close = lines.findIndex((text, i) => i > 0 && FENCE.test(text))
  if (close < 0) {
    errors.push({ line: 1, message: 'the frontmatter block has no closing ---' })
    return { fields, errors, bodyLine: lines.length + 1 }
  }
  for (let i = 1; i < close; i++) {
    const found = readLine(lines[i], i + 1, fields)
    if (found) errors.push(found)
  }
  return { fields, errors, bodyLine: close + 2 }
}

/** Reads one frontmatter line into `fields`; returns an error object, or nothing when it is fine. */
function readLine(text, line, fields) {
  if (text.trim() === '' || /^\s*#/.test(text)) return null
  if (/^\s/.test(text)) {
    return {
      line,
      message: 'indented line; nested or continued values are not supported',
    }
  }
  const match = FIELD.exec(text)
  if (!match)
    return { line, message: `expected "key: value", found "${text.trim().slice(0, 60)}"` }
  const [, key, raw = ''] = match
  if (fields.has(key)) return { line, message: `"${key}" is set twice` }
  const scalar = readScalar(raw)
  if (scalar.error) {
    // Marked invalid so the contract does not also report the key as missing.
    fields.set(key, { type: 'invalid', value: null, line })
    return { line, message: `"${key}": ${scalar.error}` }
  }
  fields.set(key, { ...scalar, line })
  return null
}

/** Checks the five-field contract the docs collection validates (title, section, order, slug, description). */
export function checkContract(fields) {
  const findings = []
  for (const [key, type] of CONTRACT) {
    const field = fields.get(key)
    if (field?.type === 'invalid') continue
    if (!field || field.type === 'null') {
      findings.push({ line: 1, message: `missing "${key}"` })
    } else if (field.type !== type) {
      findings.push({
        line: field.line,
        message: `"${key}" must be a ${type}, found a ${field.type}`,
      })
    } else if (type === 'string' && field.value.trim() === '') {
      findings.push({ line: field.line, message: `"${key}" must not be empty` })
    }
  }
  return findings
}
