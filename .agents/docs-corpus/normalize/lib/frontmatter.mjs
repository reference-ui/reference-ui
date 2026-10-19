/**
 * Frontmatter in and out. Source files use a YAML subset (flat keys, quoted
 * scalars, folded continuation lines). Output is flat `key: value` lines that
 * Memex's permissive parser reads back; a value is JSON-quoted only when a
 * plain scalar would be ambiguous.
 */

const BLOCK = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/
const TOP_KEY = /^([A-Za-z_][\w-]*):(?:\s+(.*))?$/
const CONTINUATION = /^\s+\S/
const PLAIN_START = /^[A-Za-z0-9(/.~$_]/

function unquote(value) {
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'")
  }
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value)
    } catch {
      return value.slice(1, -1)
    }
  }
  return value
}

/** Split a source file's frontmatter; folded continuation lines join with spaces. */
export function parseFrontmatter(text) {
  const match = text.match(BLOCK)
  if (!match) return { data: {}, body: text }
  const raw = {}
  let key = null
  for (const line of match[1].split('\n')) {
    const top = line.match(TOP_KEY)
    if (top) {
      key = top[1]
      raw[key] = (top[2] ?? '').trim()
    } else if (key && CONTINUATION.test(line)) {
      raw[key] = [raw[key], line.trim()].filter(Boolean).join(' ')
    }
  }
  const data = {}
  for (const [name, value] of Object.entries(raw)) data[name] = unquote(value)
  return { data, body: text.slice(match[0].length) }
}

/** One scalar as YAML-safe text: plain when unambiguous, else JSON-quoted. */
export function yamlScalar(value) {
  const s = String(value ?? '')
  if (s === '') return '""'
  const plain =
    PLAIN_START.test(s) &&
    !/[\n"\\]/.test(s) &&
    !/: |\s#|\s$/.test(s)
  return plain ? s : JSON.stringify(s)
}

/** Serialize flat fields in insertion order; arrays become inline lists. */
export function formatFrontmatter(fields) {
  const lines = ['---']
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) lines.push(`${key}: [${value.join(', ')}]`)
    else if (value === '') continue
    else lines.push(`${key}: ${yamlScalar(value)}`)
  }
  lines.push('---', '')
  return lines.join('\n')
}
