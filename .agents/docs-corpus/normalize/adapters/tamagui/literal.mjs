/**
 * Reads the JavaScript literal behind a JSX attribute (arrays, objects, strings in
 * ', " or `, numbers, and bare words such as true) and turns the JSX fragments
 * inside it into Markdown. The site's data tables are plain literals, so the
 * reader is strict: anything it does not know throws, and the run stops with the
 * text that failed rather than dropping rows silently.
 */

const WORD = /[^\s,:\]})]+/y

function fail(p, message) {
  throw new Error(`${message} at offset ${p.i}: ${JSON.stringify(p.s.slice(p.i, p.i + 60))}`)
}

/** Whitespace and JavaScript comments between tokens; the site's tables carry `// ...` divider comments. */
function skipSpace(p) {
  for (;;) {
    while (p.i < p.s.length && /\s/.test(p.s[p.i])) p.i++
    if (p.s.startsWith('//', p.i)) {
      const end = p.s.indexOf('\n', p.i)
      p.i = end === -1 ? p.s.length : end + 1
    } else if (p.s.startsWith('/*', p.i)) {
      const end = p.s.indexOf('*/', p.i + 2)
      if (end === -1) fail(p, 'unterminated comment')
      p.i = end + 2
    } else {
      return
    }
  }
}

/** A string literal in ', " or `. Escapes give the escaped character. */
function readString(p) {
  const quote = p.s[p.i++]
  let out = ''
  while (p.i < p.s.length) {
    const ch = p.s[p.i]
    if (ch === '\\') {
      const next = p.s[p.i + 1]
      out += next === 'n' ? '\n' : (next ?? '')
      p.i += 2
      continue
    }
    if (ch === quote) {
      p.i++
      return out
    }
    if (quote === '`' && ch === '$' && p.s[p.i + 1] === '{') fail(p, 'template expressions are not supported')
    out += ch
    p.i++
  }
  return fail(p, 'unterminated string')
}

function readWord(p) {
  WORD.lastIndex = p.i
  const m = WORD.exec(p.s)
  if (!m) fail(p, 'expected a value')
  p.i += m[0].length
  return m[0]
}

function readKey(p) {
  const ch = p.s[p.i]
  if (ch === "'" || ch === '"' || ch === '`') return readString(p)
  return readWord(p)
}

function readArray(p) {
  p.i++
  const out = []
  for (;;) {
    skipSpace(p)
    if (p.s[p.i] === ']') {
      p.i++
      return out
    }
    out.push(readValue(p))
    skipSpace(p)
    if (p.s[p.i] === ',') {
      p.i++
    } else if (p.s[p.i] !== ']') {
      fail(p, 'expected , or ] in array')
    }
  }
}

function readObject(p) {
  p.i++
  const out = {}
  for (;;) {
    skipSpace(p)
    if (p.s[p.i] === '}') {
      p.i++
      return out
    }
    const key = readKey(p)
    skipSpace(p)
    if (p.s[p.i] !== ':') fail(p, 'expected : after a key')
    p.i++
    out[key] = readValue(p)
    skipSpace(p)
    if (p.s[p.i] === ',') {
      p.i++
    } else if (p.s[p.i] !== '}') {
      fail(p, 'expected , or } in object')
    }
  }
}

/** A JSX element, balanced by its tags, kept as source for jsxToMarkdown. */
function readJsx(p) {
  const start = p.i
  const tag = /<(\/?)([A-Za-z][\w.]*)((?:[^<>{}]|\{[^{}]*\})*?)(\/?)>/g
  tag.lastIndex = start
  let depth = 0
  let m
  while ((m = tag.exec(p.s))) {
    if (m[1]) depth--
    else if (!m[4]) depth++
    if (depth === 0) {
      p.i = m.index + m[0].length
      return { jsx: p.s.slice(start, p.i) }
    }
  }
  return fail(p, 'unterminated JSX element')
}

function readValue(p) {
  skipSpace(p)
  const ch = p.s[p.i]
  if (ch === '[') return readArray(p)
  if (ch === '{') return readObject(p)
  if (ch === '(') {
    p.i++
    const value = readValue(p)
    skipSpace(p)
    if (p.s[p.i] !== ')') fail(p, 'expected )')
    p.i++
    return value
  }
  if (ch === '<') return readJsx(p)
  if (ch === "'" || ch === '"' || ch === '`') return readString(p)
  return readWord(p)
}

/**
 * The value of a JS literal: arrays, objects, strings, and bare words (true,
 * 12). A JSX element comes back as `{ jsx: source }`.
 */
export function parseLiteral(source) {
  const p = { s: String(source), i: 0 }
  const value = readValue(p)
  skipSpace(p)
  if (p.i < p.s.length) fail(p, 'unexpected text after the literal')
  return value
}

const JSX_TAG =
  /<(\/?)([A-Za-z][\w.]*)((?:[^<>{}]|\{[^{}]*\})*?)(\/?)>|\{\s*'((?:[^'\\]|\\.)*)'\s*\}|\{\s*"((?:[^"\\]|\\.)*)"\s*\}|\{\s*`([^`]*)`\s*\}|(\{[^{}]*\})|([^<{]+)/g

const CODE_TAGS = new Set(['code'])
const EMPHASIS = { strong: '**', b: '**', em: '*', i: '*' }

function hrefOf(attrs) {
  const m = /href=(?:"([^"]*)"|'([^']*)'|\{\s*['"`]([^'"`]*)['"`]\s*\})/.exec(attrs)
  return m ? (m[1] ?? m[2] ?? m[3]) : ''
}

/**
 * A JSX fragment (text, <code>, <a>/<Link>, emphasis, spacing) as one line of
 * Markdown. Other elements contribute their text only. A root-relative href
 * gets the site origin, like the converter's own links.
 */
export function jsxToMarkdown(raw, siteUrl = '') {
  let out = ''
  const open = []
  for (const m of String(raw).matchAll(JSX_TAG)) {
    if (m[2] !== undefined) {
      const [, closing, name, attrs, selfClosing] = m
      const tag = name.toLowerCase()
      if (closing) {
        const at = open.map(o => o.tag).lastIndexOf(tag)
        if (at !== -1) {
          out += open[at].end
          open.length = at
        }
        continue
      }
      if (selfClosing) {
        if (tag === 'br') out += ' '
        continue
      }
      if (tag === 'a' || tag === 'link') {
        const href = hrefOf(attrs)
        const absolute = href.startsWith('/') && siteUrl ? `${siteUrl}${href}` : href
        open.push({ tag, end: absolute ? `](${absolute})` : ']' })
        out += '['
      } else if (CODE_TAGS.has(tag) || tag === 'code') {
        open.push({ tag, end: '`' })
        out += '`'
      } else if (EMPHASIS[tag]) {
        open.push({ tag, end: EMPHASIS[tag] })
        out += EMPHASIS[tag]
      } else {
        open.push({ tag, end: '' })
      }
    } else if (m[5] !== undefined || m[6] !== undefined || m[7] !== undefined) {
      out += (m[5] ?? m[6] ?? m[7]).replace(/\\(.)/g, '$1')
    } else if (m[8] !== undefined) {
      fail({ s: raw, i: m.index }, 'unsupported JSX expression')
    } else if (m[9] !== undefined) {
      out += m[9].replace(/\s+/g, ' ')
    }
  }
  return out
    .replace(/\s+/g, ' ')
    .replace(/\[ +/g, '[')
    .replace(/ +\]\(/g, '](')
    .trim()
}

/** One Markdown table: header, separator, rows. Pipes are escaped, newlines flattened. */
export function mdTable(headers, rows) {
  const cell = value => String(value ?? '').replace(/\s*\r?\n\s*/g, ' ').replace(/\|/g, '\\|').trim()
  const line = cells => `| ${cells.map(cell).join(' | ')} |`
  return [line(headers), `| ${headers.map(() => '---').join(' | ')} |`, ...rows.map(line)]
}
