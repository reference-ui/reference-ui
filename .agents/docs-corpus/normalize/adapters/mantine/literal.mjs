/**
 * Reads the literal source the mantine.dev pages pass to components and the
 * demo and styles-API data files define: strings, template literals without
 * `${}`, numbers, booleans, arrays, objects, and the `<Code>` and `<>` JSX that
 * table cells use. Nothing is evaluated. An identifier comes back as a `Ref`
 * placeholder for the caller to resolve, and any other syntax throws
 * `Unsupported`, which hooks turn into a one-line note.
 */

export class Unsupported extends Error {}

/**
 * Options for the parse in progress: `interpolate(name)` supplies the text of
 * a `${name}` in a template literal; `rawExpressions` keeps any `${...}` as
 * written (used for demo code that takes its values from props).
 */
let options = {}

/** An identifier in a literal position (`code,`, `component: Demo`). */
export class Ref {
  constructor(name) {
    this.name = name
  }
}

const ESCAPES = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' }
const IDENT = /^[A-Za-z_$][\w$]*/
const KEY = /^(?:[A-Za-z_$][\w$]*|\d+)/
const NUMBER = /^-?\d+(?:\.\d+)?/

/** Index of the first character at or after `i` that is not whitespace or a comment. */
export function skipSpace(src, i) {
  for (;;) {
    while (i < src.length && /\s/.test(src[i])) i++
    if (src.startsWith('//', i)) {
      const nl = src.indexOf('\n', i)
      i = nl === -1 ? src.length : nl + 1
    } else if (src.startsWith('/*', i)) {
      const end = src.indexOf('*/', i + 2)
      if (end === -1) throw new Unsupported('unterminated comment')
      i = end + 2
    } else {
      return i
    }
  }
}

/** One escape sequence after a backslash at `j`; returns the text and the next index. */
function readEscape(src, j) {
  const c = src[j]
  if (c === '\r') return { text: '', next: src[j + 1] === '\n' ? j + 2 : j + 1 }
  if (c === '\n') return { text: '', next: j + 1 }
  if (c === 'x') return { text: String.fromCharCode(parseInt(src.slice(j + 1, j + 3), 16)), next: j + 3 }
  if (c === 'u' && src[j + 1] === '{') {
    const end = src.indexOf('}', j)
    return { text: String.fromCodePoint(parseInt(src.slice(j + 2, end), 16)), next: end + 1 }
  }
  if (c === 'u') return { text: String.fromCharCode(parseInt(src.slice(j + 1, j + 5), 16)), next: j + 5 }
  if (c in ESCAPES) return { text: ESCAPES[c], next: j + 1 }
  return { text: c, next: j + 1 }
}

export function readString(src, i) {
  const quote = src[i]
  let out = ''
  let j = i + 1
  while (j < src.length) {
    const c = src[j]
    if (c === quote) return { value: out, end: j + 1 }
    if (c === '\\') {
      const esc = readEscape(src, j + 1)
      out += esc.text
      j = esc.next
      continue
    }
    if (c === '\n') throw new Unsupported('newline inside a string')
    out += c
    j++
  }
  throw new Unsupported('unterminated string')
}

/** Template literal cooked the way JavaScript cooks it. A `${` expression is not supported. */
export function readTemplate(src, i) {
  let out = ''
  let j = i + 1
  while (j < src.length) {
    const c = src[j]
    if (c === '`') return { value: out, end: j + 1 }
    if (c === '\\') {
      const esc = readEscape(src, j + 1)
      out += esc.text
      j = esc.next
      continue
    }
    if (c === '$' && src[j + 1] === '{') {
      const close = src.indexOf('}', j + 2)
      if (close === -1) throw new Unsupported('template expression')
      const expr = src.slice(j + 2, close)
      if (options.rawExpressions) out += src.slice(j, close + 1)
      else if (options.interpolate && /^\s*[A-Za-z_$][\w$]*\s*$/.test(expr)) out += options.interpolate(expr.trim())
      else throw new Unsupported('template expression')
      j = close + 1
      continue
    }
    if (c === '\r') {
      out += '\n'
      j += src[j + 1] === '\n' ? 2 : 1
      continue
    }
    out += c
    j++
  }
  throw new Unsupported('unterminated template')
}

/** JSX text rules: lines are trimmed inside, empty lines dropped, the rest joined by one space. */
function jsxText(raw) {
  const lines = raw.split(/\r?\n/)
  if (lines.length === 1) return raw
  return lines
    .map((line, k) => {
      let t = line
      if (k > 0) t = t.replace(/^\s+/, '')
      if (k < lines.length - 1) t = t.replace(/\s+$/, '')
      return t
    })
    .filter(t => t !== '')
    .join(' ')
}

/**
 * `<Code>text</Code>` becomes a code span; `<>...</>` becomes its text, with
 * nested `<Code>` spans and `{' '}` spaces. Any other JSX throws.
 */
function readJsx(src, i) {
  const open = src.slice(i).match(/^<(>|Code>|code>)/)
  if (!open) throw new Unsupported('jsx tag')
  const isCode = open[1] !== '>'
  const close = open[1] === '>' ? '</>' : open[1] === 'code>' ? '</code>' : '</Code>'
  let j = i + open[0].length
  let out = ''
  for (;;) {
    if (src.startsWith(close, j)) {
      j += close.length
      break
    }
    if (j >= src.length) throw new Unsupported('unterminated jsx')
    if (src.startsWith("{' '}", j)) {
      out += ' '
      j += 5
    } else if (src.startsWith('<Code>', j) || src.startsWith('<code>', j)) {
      const child = readJsx(src, j)
      out += child.value
      j = child.end
    } else if (src[j] === '<' || src[j] === '{') {
      throw new Unsupported('jsx child')
    } else {
      let k = j
      while (k < src.length && src[k] !== '<' && src[k] !== '{') k++
      out += jsxText(src.slice(j, k))
      j = k
    }
  }
  return { value: isCode ? `\`${out}\`` : out, end: j }
}

function readArray(src, i) {
  const out = []
  let j = skipSpace(src, i + 1)
  while (src[j] !== ']') {
    const item = readValue(src, j)
    out.push(item.value)
    j = skipSpace(src, item.end)
    if (src[j] === ',') {
      j = skipSpace(src, j + 1)
      continue
    }
    if (src[j] !== ']') throw new Unsupported('array separator')
  }
  return { value: out, end: j + 1 }
}

/** Spread sources (`...Other.selectors`) of an object literal, in source order. */
export const SPREADS = Symbol('spreads')

function readObject(src, i) {
  const out = {}
  const spreads = []
  Object.defineProperty(out, SPREADS, { value: spreads, enumerable: false })
  let j = skipSpace(src, i + 1)
  while (src[j] !== '}') {
    if (src.startsWith('...', j)) {
      const ref = src.slice(j + 3).match(/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*/)
      if (!ref) throw new Unsupported('spread')
      spreads.push({ ref: ref[0] })
      j = skipSpace(src, j + 3 + ref[0].length)
      if (src[j] === ',') {
        j = skipSpace(src, j + 1)
        continue
      }
      if (src[j] !== '}') throw new Unsupported('object separator')
      break
    }
    let key
    if (src[j] === '"' || src[j] === "'") {
      const s = readString(src, j)
      key = s.value
      j = s.end
    } else {
      const m = src.slice(j).match(KEY)
      if (!m) throw new Unsupported('object key')
      key = m[0]
      j += key.length
    }
    if (key === '__proto__') throw new Unsupported('__proto__ key')
    j = skipSpace(src, j)
    if (src[j] === ':') {
      const v = readValue(src, skipSpace(src, j + 1))
      out[key] = v.value
      j = skipSpace(src, v.end)
    } else if (src[j] === ',' || src[j] === '}') {
      out[key] = new Ref(key)
    } else {
      throw new Unsupported('object colon')
    }
    if (src[j] === ',') {
      j = skipSpace(src, j + 1)
      continue
    }
    if (src[j] !== '}') throw new Unsupported('object separator')
  }
  return { value: out, end: j + 1 }
}

function readNumber(src, i) {
  const m = src.slice(i).match(NUMBER)
  if (!m) throw new Unsupported('number')
  return { value: Number(m[0]), end: i + m[0].length }
}

/** One literal value starting at `i` (which must already be past whitespace). */
function readValue(src, i) {
  const c = src[i]
  if (c === '[') return readArray(src, i)
  if (c === '{') return readObject(src, i)
  if (c === '"' || c === "'") return readString(src, i)
  if (c === '`') return readTemplate(src, i)
  if (c === '<') return readJsx(src, i)
  if (c === '-' || /[0-9]/.test(c ?? '')) return readNumber(src, i)
  const word = src.slice(i).match(IDENT)
  if (word) {
    const end = i + word[0].length
    if (word[0] === 'true' || word[0] === 'false') return { value: word[0] === 'true', end }
    if (word[0] === 'null') return { value: null, end }
    return { value: new Ref(word[0]), end }
  }
  throw new Unsupported(`unexpected '${c ?? 'end of text'}'`)
}

/**
 * The literal value that starts at `start` (leading whitespace allowed), with
 * its end index. `opts` is { interpolate, rawExpressions } (see `options`).
 */
export function parseValue(src, start = 0, opts = {}) {
  const saved = options
  options = opts
  try {
    const v = readValue(src, skipSpace(src, start))
    return { value: v.value, end: v.end }
  } finally {
    options = saved
  }
}

/** Whole text as one literal value, with nothing after it. */
export function parseLiteral(src) {
  const { value, end } = parseValue(src, 0)
  if (skipSpace(src, end) !== src.length) throw new Unsupported('text after the value')
  return value
}

/** Skips one value expression (balanced brackets, strings, templates) up to a top-level `,` or closing bracket. */
export function skipValue(src, i) {
  let depth = 0
  while (i < src.length) {
    const c = src[i]
    if (c === '"' || c === "'") {
      i = readString(src, i).end
      continue
    }
    if (c === '`') {
      i = skipTemplate(src, i)
      continue
    }
    if (c === '/' && (src[i + 1] === '/' || src[i + 1] === '*')) {
      i = skipSpace(src, i)
      continue
    }
    if (c === '(' || c === '[' || c === '{') depth++
    else if (c === ')' || c === ']' || c === '}') {
      if (depth === 0) return i
      depth--
    } else if (c === ',' && depth === 0) {
      return i
    }
    i++
  }
  return i
}

function skipTemplate(src, i) {
  let j = i + 1
  while (j < src.length) {
    if (src[j] === '\\') j += 2
    else if (src[j] === '`') return j + 1
    else if (src[j] === '$' && src[j + 1] === '{') {
      let depth = 0
      for (; j < src.length; j++) {
        if (src[j] === '{') depth++
        else if (src[j] === '}' && --depth === 0) break
      }
      j++
    } else j++
  }
  throw new Unsupported('unterminated template')
}

/**
 * The properties of the object literal whose `{` is at `open`: key -> index of
 * the value. A shorthand property (`code,`) maps to the index of its key.
 * Values are not parsed here, so a property the caller does not need can hold
 * syntax this module does not read.
 */
export function objectProperties(src, open) {
  const props = new Map()
  let j = skipSpace(src, open + 1)
  while (src[j] !== '}') {
    const keyStart = j
    let key
    if (src[j] === '"' || src[j] === "'") {
      const s = readString(src, j)
      key = s.value
      j = s.end
    } else {
      const m = src.slice(j).match(KEY)
      if (!m) throw new Unsupported('object key')
      key = m[0]
      j += key.length
    }
    j = skipSpace(src, j)
    if (src[j] === ':') {
      const valueStart = skipSpace(src, j + 1)
      props.set(key, valueStart)
      j = skipSpace(src, skipValue(src, valueStart))
    } else {
      props.set(key, keyStart)
    }
    if (src[j] === ',') {
      j = skipSpace(src, j + 1)
      continue
    }
    if (src[j] !== '}') throw new Unsupported('object separator')
  }
  return props
}

/** Escapes a value for a Markdown table cell. */
export function cell(text) {
  return String(text ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim()
}
