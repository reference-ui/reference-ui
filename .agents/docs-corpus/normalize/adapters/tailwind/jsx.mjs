/**
 * Reads JSX-like source as text for the Tailwind adapter: string, template,
 * number and literal values, objects, arrays, tagged templates (`dedent`) and
 * JSX trees. Nothing from the source is executed. Anything outside this subset
 * throws a SourceError with the file offset, so a caller can name it.
 */

export class SourceError extends Error {}

const TAG = /<([A-Za-z][\w.-]*)/y
const ATTR = /[A-Za-z_:][\w:.-]*/y
const IDENT = /[A-Za-z_$][\w$]*/y
const NUMBER = /-?\d+(\.\d+)?/y
const CLOSING = /<\/([A-Za-z][\w.-]*)?\s*>/y
const ESCAPES = { n: '\n', t: '\t', r: '\r' }
const ENTITIES = { '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ' }
/** Tags whose template body is dedented, as utils.ts and the MDX pages use them. */
const DEDENT_TAGS = new Set(['dedent', 'css', 'js', 'shell', 'html', 'astro', 'twig', 'elixir', 'handlebars'])

function fail(src, i, what) {
  const line = src.slice(0, i).split('\n').length
  throw new SourceError(`${what} at line ${line}: ${JSON.stringify(src.slice(i, i + 50))}`)
}

/** Skips whitespace and JS comments (only between tokens of an expression). */
export function skipSpace(src, i) {
  for (;;) {
    while (i < src.length && /\s/.test(src[i])) i++
    if (src.startsWith('//', i)) {
      const end = src.indexOf('\n', i)
      i = end === -1 ? src.length : end + 1
    } else if (src.startsWith('/*', i)) {
      const end = src.indexOf('*/', i + 2)
      if (end === -1) fail(src, i, 'unclosed comment')
      i = end + 2
    } else {
      return i
    }
  }
}

function readString(src, i) {
  const quote = src[i]
  let out = ''
  let j = i + 1
  while (j < src.length && src[j] !== quote) {
    if (src[j] === '\\') {
      out += ESCAPES[src[j + 1]] ?? src[j + 1]
      j += 2
    } else {
      out += src[j]
      j++
    }
  }
  if (j >= src.length) fail(src, i, 'unclosed string')
  return { value: out, end: j + 1 }
}

/** The raw body of a template literal. Expressions inside it are refused. */
function readTemplate(src, i) {
  let j = i + 1
  while (j < src.length && src[j] !== '`') {
    if (src[j] === '\\') j += 2
    else if (src[j] === '$' && src[j + 1] === '{') fail(src, j, 'template expression')
    else j++
  }
  if (j >= src.length) fail(src, i, 'unclosed template')
  return { raw: src.slice(i + 1, j), end: j + 1 }
}

/** An untagged template's text, with its escapes read as JavaScript reads them. */
function cook(raw) {
  return raw.replace(/\\([\s\S])/g, (_, c) => ESCAPES[c] ?? c)
}

/** The `dedent` package's result for a raw template body (indent removed, trimmed). */
export function dedent(raw) {
  let text = raw.replace(/\\\n[ \t]*/g, '').replace(/\\`/g, '`')
  const lines = text.split('\n')
  let least = null
  for (const line of lines) {
    const m = line.match(/^(\s+)\S+/)
    if (m) least = least === null ? m[1].length : Math.min(least, m[1].length)
  }
  if (least !== null) text = lines.map(line => (line[0] === ' ' || line[0] === '\t' ? line.slice(least) : line)).join('\n')
  return text.trim().replace(/\\n/g, '\n')
}

function readObject(src, i) {
  const obj = {}
  let j = i + 1
  for (;;) {
    j = skipSpace(src, j)
    if (src[j] === '}') return { value: obj, end: j + 1 }
    let key
    if (src[j] === '"' || src[j] === "'") {
      const s = readString(src, j)
      key = s.value
      j = s.end
    } else {
      IDENT.lastIndex = j
      const id = IDENT.exec(src)
      if (!id) fail(src, j, 'object key')
      key = id[0]
      j += key.length
    }
    j = skipSpace(src, j)
    if (src[j] === ':') {
      const v = readExpr(src, j + 1)
      obj[key] = v.value
      j = v.end
    } else if (src[j] === ',' || src[j] === '}') {
      obj[key] = { $ident: key }
    } else {
      fail(src, j, 'object entry')
    }
    j = skipSpace(src, j)
    if (src[j] === ',') j++
    else if (src[j] !== '}') fail(src, j, 'expected , or } in object')
  }
}

function readArray(src, i) {
  const arr = []
  let j = i + 1
  for (;;) {
    j = skipSpace(src, j)
    if (src[j] === ']') return { value: arr, end: j + 1 }
    const v = readExpr(src, j)
    arr.push(v.value)
    j = skipSpace(src, v.end)
    if (src[j] === ',') j++
    else if (src[j] !== ']') fail(src, j, 'expected , or ] in array')
  }
}

/** A JSX `{...}` container at src[i]: its expression, or `empty` for a comment-only container. */
export function readContainer(src, i) {
  const j = skipSpace(src, i + 1)
  if (src[j] === '}') return { value: undefined, end: j + 1, empty: true }
  const v = readExpr(src, j)
  const k = skipSpace(src, v.end)
  if (src[k] !== '}') fail(src, k, 'expected } after expression')
  return { value: v.value, end: k + 1, empty: false }
}

/** An expression at src[i]: returns { value, end }. Identifiers come back as { $ident }. */
export function readExpr(src, i) {
  i = skipSpace(src, i)
  const c = src[i]
  if (c === '"' || c === "'") return readString(src, i)
  if (c === '`') {
    const t = readTemplate(src, i)
    return { value: cook(t.raw), end: t.end }
  }
  if (c === '{') return readObject(src, i)
  if (c === '[') return readArray(src, i)
  if (c === '(') {
    const inner = readExpr(src, i + 1)
    const k = skipSpace(src, inner.end)
    if (src[k] !== ')') fail(src, k, 'expected )')
    return { value: inner.value, end: k + 1 }
  }
  if (c === '<') return readElement(src, i)
  NUMBER.lastIndex = i
  const num = NUMBER.exec(src)
  if (num) return { value: Number(num[0]), end: i + num[0].length }
  IDENT.lastIndex = i
  const id = IDENT.exec(src)
  if (!id) fail(src, i, 'unsupported expression')
  const name = id[0]
  const after = i + name.length
  if (src[after] === '`') {
    if (!DEDENT_TAGS.has(name)) fail(src, after, `template tag ${name} is not a dedent tag`)
    const t = readTemplate(src, after)
    return { value: dedent(t.raw), end: t.end }
  }
  if (name === 'true') return { value: true, end: after }
  if (name === 'false') return { value: false, end: after }
  if (name === 'null') return { value: null, end: after }
  return { value: { $ident: name }, end: after }
}

/** The opening tag at src[i]: its name, attributes, and where it ends. */
export function readOpenTag(src, i) {
  TAG.lastIndex = i
  const m = TAG.exec(src)
  if (!m) fail(src, i, 'expected a tag')
  const name = m[1]
  const attrs = {}
  let j = i + m[0].length
  for (;;) {
    j = skipSpace(src, j)
    if (src.startsWith('/>', j)) return { name, attrs, selfClosing: true, end: j + 2 }
    if (src[j] === '>') return { name, attrs, selfClosing: false, end: j + 1 }
    ATTR.lastIndex = j
    const a = ATTR.exec(src)
    if (!a) fail(src, j, 'attribute')
    const key = a[0]
    j = skipSpace(src, j + key.length)
    if (src[j] !== '=') {
      attrs[key] = true
      continue
    }
    j = skipSpace(src, j + 1)
    if (src[j] === '"' || src[j] === "'") {
      const end = src.indexOf(src[j], j + 1)
      if (end === -1) fail(src, j, 'unclosed attribute')
      attrs[key] = src.slice(j + 1, end)
      j = end + 1
    } else if (src[j] === '{') {
      const c = readContainer(src, j)
      attrs[key] = c.value
      j = c.end
    } else {
      fail(src, j, 'attribute value')
    }
  }
}

function readElement(src, i) {
  if (src.startsWith('<>', i)) {
    const kids = readChildren(src, i + 2, '')
    return { value: { $jsx: '', attrs: {}, children: kids.children }, end: kids.end }
  }
  if (src.startsWith('</', i)) fail(src, i, 'unexpected closing tag')
  const open = readOpenTag(src, i)
  if (open.selfClosing) return { value: { $jsx: open.name, attrs: open.attrs, children: [] }, end: open.end }
  const kids = readChildren(src, open.end, open.name)
  return { value: { $jsx: open.name, attrs: open.attrs, children: kids.children }, end: kids.end }
}

function readChildren(src, i, name) {
  const children = []
  let j = i
  for (;;) {
    if (j >= src.length) fail(src, i, `unclosed <${name}>`)
    if (src.startsWith('</', j)) {
      CLOSING.lastIndex = j
      const m = CLOSING.exec(src)
      if (!m) fail(src, j, 'closing tag')
      if ((m[1] ?? '') !== name) fail(src, j, `closing tag does not match <${name}>`)
      return { children, end: j + m[0].length }
    }
    if (src[j] === '<') {
      const el = readElement(src, j)
      children.push(el.value)
      j = el.end
    } else if (src[j] === '{') {
      const c = readContainer(src, j)
      if (!c.empty) children.push({ $expr: c.value })
      j = c.end
    } else {
      let k = j
      while (k < src.length && src[k] !== '<' && src[k] !== '{') k++
      children.push({ $text: src.slice(j, k) })
      j = k
    }
  }
}

/**
 * Every top-level `let|const NAME: TYPE = VALUE` (exported or not), read as values.
 * Only column-0 declarations count (code inside templates is indented), and the
 * scan resumes after each value, so nothing inside a value is read as a declaration.
 */
export function readExports(src) {
  const out = {}
  const re = /^(?:export\s+)?(?:let|const)\s+(\w+)\s*(?::[^=\n]*)?=\s*/gm
  let m
  while ((m = re.exec(src))) {
    const v = readExpr(src, m.index + m[0].length)
    out[m[1]] = v.value
    re.lastIndex = v.end
  }
  return out
}

/** The JSX a module's default export returns (the first `return (` after `export default`). */
export function readDefaultReturn(src) {
  const at = src.indexOf('export default')
  if (at === -1) return null
  const re = /return\s*\(/g
  re.lastIndex = at
  const m = re.exec(src)
  if (!m) return null
  return readExpr(src, m.index + m[0].length - 1).value
}

/** Replaces the balanced `{...}` at src[start] with `replacement` (strings and templates are opaque). */
export function replaceBalancedBlock(src, start, replacement) {
  let depth = 0
  let quote = null
  for (let i = start; i < src.length; i++) {
    const c = src[i]
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') quote = c
    else if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return src.slice(0, start) + replacement + src.slice(i + 1)
    }
  }
  fail(src, start, 'unbalanced block')
}

/** JSX text cleaned the way the JSX compiler cleans it: line breaks and indent drop, lines join with a space. */
export function cleanText(raw) {
  const lines = raw.split(/\r\n|\n|\r/)
  let lastNonEmpty = -1
  lines.forEach((line, i) => {
    if (/\S/.test(line)) lastNonEmpty = i
  })
  let out = ''
  lines.forEach((line, i) => {
    let text = line.replace(/\t/g, ' ')
    if (i > 0) text = text.replace(/^[ ]+/, '')
    if (i < lines.length - 1) text = text.replace(/[ ]+$/, '')
    if (text) out += i === lastNonEmpty ? text : `${text} `
  })
  return out
}

export function decodeEntities(text) {
  return text.replace(/&(?:lt|gt|amp|quot|#39|apos|nbsp);/g, entity => ENTITIES[entity])
}
