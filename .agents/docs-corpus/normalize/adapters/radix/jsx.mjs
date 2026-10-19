/**
 * Reader for the JSX and JS literals in the Radix MDX. The adapter lifts props
 * data and code strings out of a page before the runner converts it (the
 * runner's attribute reader stops at one level of nested braces), and turns
 * inline JSX in prose into Markdown (the runner would mark each inline tag as
 * unresolved). Anything this reader cannot parse throws, so a new construct
 * fails the run instead of leaking into the corpus.
 */

export class ReadError extends Error {}

/** A parsed JSX element. */
export class JsxEl {
  constructor(name, attrs, children, selfClosing) {
    this.name = name
    this.attrs = attrs
    this.children = children
    this.selfClosing = selfClosing
  }
}

/** Raw JSX text between tags or braces. */
export class JsxText {
  constructor(value) {
    this.value = value
  }
}

/** A `{expression}` in JSX children or an attribute value. */
export class JsxExpr {
  constructor(value) {
    this.value = value
  }
}

/** A bare identifier used as a value (`props.x`); the adapter never evaluates it. */
class Ident {
  constructor(name) {
    this.name = name
  }
}

const TAG_NAME = /[A-Za-z_][\w.:-]*/y
const ATTR_NAME = /[A-Za-z_][\w:-]*/y
const OBJ_KEY = /[A-Za-z_$][\w$]*/y
const IDENT = /[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*/y
const NUMBER = /-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/iy
const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'wbr'])
const ESCAPES = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' }
const LITERALS = { true: true, false: false, null: null, undefined: undefined }

function at(re, src, i) {
  re.lastIndex = i
  const m = re.exec(src)
  return m ? m[0] : null
}

function fail(src, i, message) {
  const near = src.slice(i, i + 60).replace(/\s+/g, ' ')
  throw new ReadError(`${message}, near "${near}"`)
}

/** Skips whitespace and JS comments. */
export function skipSpace(src, start) {
  let i = start
  for (;;) {
    while (i < src.length && /\s/.test(src[i])) i++
    if (src.startsWith('//', i)) {
      const nl = src.indexOf('\n', i)
      i = nl === -1 ? src.length : nl + 1
    } else if (src.startsWith('/*', i)) {
      const end = src.indexOf('*/', i + 2)
      if (end === -1) fail(src, i, 'unclosed comment')
      i = end + 2
    } else return i
  }
}

function readEscape(src, j) {
  const c = src[j + 1]
  if (c === 'u') {
    if (src[j + 2] === '{') {
      const end = src.indexOf('}', j + 3)
      if (end === -1) fail(src, j, 'bad unicode escape')
      return { text: String.fromCodePoint(parseInt(src.slice(j + 3, end), 16)), end: end + 1 }
    }
    return { text: String.fromCharCode(parseInt(src.slice(j + 2, j + 6), 16)), end: j + 6 }
  }
  if (c === 'x') return { text: String.fromCharCode(parseInt(src.slice(j + 2, j + 4), 16)), end: j + 4 }
  if (c === '\n') return { text: '', end: j + 2 }
  return { text: ESCAPES[c] ?? c, end: j + 2 }
}

/** A JS string or template literal (no `${}`), with its escapes cooked. */
function readQuoted(src, i) {
  const quote = src[i]
  let value = ''
  let j = i + 1
  while (j < src.length && src[j] !== quote) {
    if (src[j] === '\n' && quote !== '`') fail(src, i, 'newline in string')
    if (src[j] === '\\') {
      const e = readEscape(src, j)
      value += e.text
      j = e.end
      continue
    }
    if (quote === '`' && src.startsWith('${', j)) fail(src, i, 'template interpolation is not supported')
    value += src[j++]
  }
  if (src[j] !== quote) fail(src, i, 'unclosed string')
  return { value, end: j + 1 }
}

function parseObject(src, start) {
  const obj = {}
  let i = start + 1
  for (;;) {
    i = skipSpace(src, i)
    if (src[i] === '}') return { value: obj, end: i + 1 }
    let key
    if (src[i] === '"' || src[i] === "'") {
      const q = readQuoted(src, i)
      key = q.value
      i = q.end
    } else {
      key = at(OBJ_KEY, src, i)
      if (key === null) fail(src, i, 'bad object key')
      i += key.length
    }
    i = skipSpace(src, i)
    if (src[i] !== ':') fail(src, i, 'expected : after object key')
    const v = parseValue(src, i + 1)
    obj[key] = v.value
    i = skipSpace(src, v.end)
    if (src[i] === ',') {
      i++
      continue
    }
    if (src[i] === '}') return { value: obj, end: i + 1 }
    fail(src, i, 'expected , or } in object')
  }
}

function parseArray(src, start) {
  const list = []
  let i = start + 1
  for (;;) {
    i = skipSpace(src, i)
    if (src[i] === ']') return { value: list, end: i + 1 }
    const v = parseValue(src, i)
    list.push(v.value)
    i = skipSpace(src, v.end)
    if (src[i] === ',') {
      i++
      continue
    }
    if (src[i] === ']') return { value: list, end: i + 1 }
    fail(src, i, 'expected , or ] in array')
  }
}

/** A JS value: literal, array, object, parenthesised JSX, or JSX element. */
export function parseValue(src, start) {
  const i = skipSpace(src, start)
  const c = src[i]
  if (c === '{') return parseObject(src, i)
  if (c === '[') return parseArray(src, i)
  if (c === '"' || c === "'" || c === '`') return readQuoted(src, i)
  if (c === '(') {
    const j = skipSpace(src, i + 1)
    const inner = src[j] === '<' ? parseElement(src, j) : parseValue(src, j)
    const k = skipSpace(src, inner.end)
    if (src[k] !== ')') fail(src, k, 'expected ) after parenthesised value')
    return { value: inner.value, end: k + 1 }
  }
  if (c === '<') return parseElement(src, i)
  const num = at(NUMBER, src, i)
  if (num !== null) return { value: Number(num), end: i + num.length }
  const id = at(IDENT, src, i)
  if (id !== null) {
    if (Object.hasOwn(LITERALS, id)) return { value: LITERALS[id], end: i + id.length }
    return { value: new Ident(id), end: i + id.length }
  }
  return fail(src, i, 'unsupported value')
}

/** A `{...}` container: an expression, or nothing (a JSX comment). */
function parseBraced(src, start) {
  const i = skipSpace(src, start + 1)
  if (src[i] === '}') return { value: undefined, end: i + 1 }
  const v = parseValue(src, i)
  const j = skipSpace(src, v.end)
  if (src[j] !== '}') fail(src, j, 'expected } after expression')
  return { value: v.value, end: j + 1 }
}

/** The name and attributes of an opening tag, up to and including its `>` or `/>`. */
export function parseHead(src, start) {
  let i = start + 1
  let name = ''
  if (src[i] !== '>') {
    name = at(TAG_NAME, src, i)
    if (name === null) fail(src, i, 'bad tag name')
    i += name.length
  }
  const attrs = {}
  for (;;) {
    i = skipSpace(src, i)
    if (src.startsWith('/>', i)) return { name, attrs, selfClosing: true, end: i + 2 }
    if (src[i] === '>') return { name, attrs, selfClosing: VOID.has(name), end: i + 1 }
    const attr = at(ATTR_NAME, src, i)
    if (attr === null) fail(src, i, 'bad attribute')
    i = skipSpace(src, i + attr.length)
    if (src[i] !== '=') {
      attrs[attr] = true
      continue
    }
    i = skipSpace(src, i + 1)
    const q = src[i]
    if (q === '"' || q === "'") {
      const close = src.indexOf(q, i + 1)
      if (close === -1) fail(src, i, 'unclosed attribute string')
      attrs[attr] = src.slice(i + 1, close)
      i = close + 1
    } else if (q === '{') {
      const r = parseBraced(src, i)
      attrs[attr] = new JsxExpr(r.value)
      i = r.end
    } else if (q === '<') {
      const r = parseElement(src, i)
      attrs[attr] = new JsxExpr(r.value)
      i = r.end
    } else fail(src, i, 'bad attribute value')
  }
}

/** A whole element, children included. */
export function parseElement(src, start) {
  const head = parseHead(src, start)
  const { name, attrs } = head
  if (head.selfClosing) return { value: new JsxEl(name, attrs, [], true), end: head.end }
  const children = []
  let i = head.end
  for (;;) {
    if (src.startsWith('</', i)) {
      let j = skipSpace(src, i + 2)
      const close = name === '' ? '' : at(TAG_NAME, src, j)
      if (close === null) fail(src, j, 'bad closing tag')
      j = skipSpace(src, j + close.length)
      if (src[j] !== '>') fail(src, j, 'bad closing tag')
      if (close !== name) fail(src, i, `</${close}> closes <${name}>`)
      return { value: new JsxEl(name, attrs, children, false), end: j + 1 }
    }
    if (i >= src.length) fail(src, start, `unclosed <${name}>`)
    if (src[i] === '<') {
      const r = parseElement(src, i)
      children.push(r.value)
      i = r.end
    } else if (src[i] === '{') {
      const r = parseBraced(src, i)
      children.push(new JsxExpr(r.value))
      i = r.end
    } else {
      let j = i
      while (j < src.length && src[j] !== '<' && src[j] !== '{') j++
      children.push(new JsxText(src.slice(i, j)))
      i = j
    }
  }
}

/**
 * JSX whitespace, as React and Babel read it: each line is trimmed except at
 * the text's own ends, empty lines drop out, and the rest join with one space.
 */
export function cleanText(raw) {
  const lines = raw.split(/\r\n|\n|\r/)
  let lastNonEmpty = 0
  lines.forEach((line, i) => {
    if (/[^ \t]/.test(line)) lastNonEmpty = i
  })
  let out = ''
  lines.forEach((line, i) => {
    let text = line.replace(/\t/g, ' ')
    if (i > 0) text = text.replace(/^ +/, '')
    if (i < lines.length - 1) text = text.replace(/ +$/, '')
    if (text) out += i === lastNonEmpty ? text : `${text} `
  })
  return out
}

/** Inline code: the text in backticks, with a longer fence when the text holds a backtick. */
export function codeSpan(text) {
  const value = text.trim()
  if (!value) return ''
  if (!value.includes('`')) return `\`${value}\``
  return `\`\` ${value} \`\``
}

/** Link target: absolute URLs stay; root-relative and page-relative ones resolve against the live page. */
export function absoluteUrl(href, { pageUrl, siteUrl }) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return href
  if (href.startsWith('#')) return pageUrl.split('#')[0] + href
  if (href.startsWith('/')) return `${siteUrl}${href}`
  return new URL(href, pageUrl).href
}

/** The string an attribute carries, whether written as "x" or {"x"}. */
export function stringOf(value) {
  if (typeof value === 'string') return value
  if (value instanceof JsxExpr && typeof value.value === 'string') return value.value
  return undefined
}

function linkMarkdown(node, ctx) {
  const label = nodesMarkdown(node.children, ctx).trim()
  const href = stringOf(node.attrs.href)
  if (!href) return label
  const url = absoluteUrl(href, ctx)
  return label ? `[${label}](${url})` : url
}

function prMarkdown(node) {
  const id = node.attrs.id instanceof JsxExpr ? node.attrs.id.value : stringOf(node.attrs.id)
  if (id === undefined) throw new ReadError('PRLink without an id')
  return `[#${id}](https://github.com/radix-ui/primitives/pull/${id})`
}

/** Markdown for one element met in running text (inline use, or a value inside a hook). */
export function elementMarkdown(node, ctx) {
  const name = node.name
  switch (name) {
    case '':
      return nodesMarkdown(node.children, ctx)
    case 'Code':
    case 'code':
    case 'Kbd':
    case 'kbd':
      return codeSpan(nodesMarkdown(node.children, ctx))
    case 'a':
    case 'Link':
    case 'NextLink':
      return linkMarkdown(node, ctx)
    case 'PRLink':
      return prMarkdown(node)
    case 'br':
      return ' '
    case 'strong':
    case 'Strong':
    case 'b': {
      const text = nodesMarkdown(node.children, ctx).trim()
      return text ? `**${text}**` : ''
    }
    case 'em':
    case 'Em':
    case 'i': {
      const text = nodesMarkdown(node.children, ctx).trim()
      return text ? `*${text}*` : ''
    }
    default:
      if (/Icon$/.test(name)) return ''
      return nodesMarkdown(node.children, ctx)
  }
}

/** Markdown for a JSX child, attribute or lifted value. */
export function valueMarkdown(value, ctx) {
  if (value instanceof JsxEl) return elementMarkdown(value, ctx)
  if (value instanceof JsxExpr) return valueMarkdown(value.value, ctx)
  if (value instanceof JsxText) return cleanText(value.value)
  if (value === undefined || value === null || typeof value === 'boolean') return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  throw new ReadError('expression is not renderable as text')
}

/** Markdown for a list of JSX children, in order. */
export function nodesMarkdown(nodes, ctx) {
  return nodes.map(node => valueMarkdown(node, ctx)).join('')
}

const CODE_SPAN = /(`+)[\s\S]*?\1/g

/** Marks the characters of each line that sit inside a backtick code span. */
function codeMask(text) {
  const mask = new Uint8Array(text.length)
  let start = 0
  for (const line of text.split('\n')) {
    for (const m of line.matchAll(CODE_SPAN)) mask.fill(1, start + m.index, start + m.index + m[0].length)
    start += line.length + 1
  }
  return mask
}

const TAG_START = /^<(>|[A-Za-z_][\w.:-]*)/
const ICON = /^[A-Z][\w]*Icon$/
const INLINE = new Set(['', 'a', 'Badge', 'br', 'code', 'Code', 'em', 'Em', 'i', 'Kbd', 'kbd', 'Link', 'NextLink', 'PRLink', 'span', 'Strong', 'strong', 'b'])
/** Lifted whole: the page renders these from their children, so the children become one value. */
const WHOLE = new Set(['CodeBlock.Code', 'Table.Root'])

function serializeTag(name, attrs, selfClosing, ctx) {
  const parts = [name]
  for (const [key, value] of Object.entries(attrs)) {
    if (value === true) parts.push(key)
    else if (typeof value === 'string') parts.push(`${key}=${attrQuote(value)}`)
    else if (value instanceof JsxExpr) parts.push(`${key}=${attrQuote(lift(ctx, value.value))}`)
    else throw new ReadError(`attribute ${key} on <${name}> is not readable`)
  }
  return `<${parts.join(' ')}${selfClosing ? ' />' : '>'}`
}

function attrQuote(value) {
  if (!value.includes('"')) return `"${value}"`
  if (!value.includes("'")) return `'${value}'`
  throw new ReadError(`attribute value has both quote kinds: ${value}`)
}

/** Keeps a value out of the text: the runner sees "#n", the hook reads the value back. */
function lift(ctx, value) {
  ctx.values.push(value)
  return `#${ctx.values.length - 1}`
}

/** CodeBlock.Code keeps its code string; Table.Root keeps its rows as a tree. */
function liftWhole(node, ctx) {
  if (node.name === 'CodeBlock.Code') {
    const code = node.children
      .filter(child => !(child instanceof JsxText && !child.value.trim()))
      .map(child => {
        if (child instanceof JsxExpr && typeof child.value === 'string') return child.value
        throw new ReadError('CodeBlock.Code child is not a string')
      })
      .join('')
    return serializeTag(node.name, { ...node.attrs, code: new JsxExpr(code) }, true, ctx)
  }
  return serializeTag(node.name, { ...node.attrs, rows: new JsxExpr(node) }, true, ctx)
}

const hasLiftable = attrs => Object.values(attrs).some(value => value instanceof JsxExpr)

/** Visible tab labels (Tabs.Trigger text) by value, so each Tabs.Content can show its label. */
function collectTabLabels(root, ctx) {
  const walk = node => {
    if (!(node instanceof JsxEl)) return
    if (node.name === 'Tabs.Trigger' && typeof node.attrs.value === 'string') {
      const label = nodesMarkdown(node.children, ctx).trim()
      const known = ctx.tabLabels.get(node.attrs.value)
      if (known !== undefined && known !== label) throw new ReadError(`tab value ${node.attrs.value} has two labels`)
      ctx.tabLabels.set(node.attrs.value, label)
    }
    node.children.forEach(walk)
  }
  walk(root)
}

/** A tag met in running text: null leaves it for the runner, otherwise its replacement and end. */
function convertTag(text, i, ctx) {
  if (text[i + 1] === '/') return null
  const m = TAG_START.exec(text.slice(i, i + 200))
  if (!m) return null
  const name = m[1] === '>' ? '' : m[1]
  if (INLINE.has(name) || ICON.test(name)) {
    const el = parseElement(text, i)
    return { text: valueMarkdown(el.value, ctx), end: el.end }
  }
  if (WHOLE.has(name)) {
    const el = parseElement(text, i)
    return { text: liftWhole(el.value, ctx), end: el.end }
  }
  let head
  try {
    head = parseHead(text, i)
  } catch (err) {
    if (err instanceof ReadError) return null
    throw err
  }
  if (name === 'Tabs.Root') collectTabLabels(parseElement(text, i).value, ctx)
  if (name === 'Tabs.Content' && typeof head.attrs.value === 'string' && ctx.tabLabels.has(head.attrs.value)) {
    head.attrs.label = new JsxExpr(ctx.tabLabels.get(head.attrs.value))
  }
  if (!hasLiftable(head.attrs)) return null
  return { text: serializeTag(head.name, head.attrs, head.selfClosing, ctx), end: head.end }
}

const SPACE_EXPR = /^\{\s*(["'])\s\1\s*\}/
const MDX_COMMENT = /^\{\s*\/\*[\s\S]*?\*\/\s*\}/

function braceToken(text, i) {
  const rest = text.slice(i, i + 400)
  const space = SPACE_EXPR.exec(rest)
  if (space) return { text: ' ', end: i + space[0].length }
  const comment = MDX_COMMENT.exec(rest)
  if (comment) return { text: '', end: i + comment[0].length }
  return null
}

/** Drops the braces of a column-0 `{` + JSX + column-0 `}`: an MDX wrapper around one element. Indented braces are object or JSX syntax. */
function unwrapBraceLines(lines) {
  let unwrapped = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] !== '{') continue
    let j = i + 1
    while (j < lines.length && lines[j].trim() === '') j++
    if (j >= lines.length || !lines[j].trimStart().startsWith('<')) continue
    let k = j
    while (k < lines.length && lines[k] !== '}') k++
    if (k >= lines.length) continue
    lines[i] = ''
    lines[k] = ''
    unwrapped++
  }
  return unwrapped
}

/** Markdown links to relative targets resolve against the live page, outside code spans. */
function absolutizeLinks(text, ctx) {
  const link = /\]\(([^()\s]+)\)/g
  return text
    .split('\n')
    .map(line => {
      let out = ''
      let last = 0
      for (const m of line.matchAll(CODE_SPAN)) {
        out += line.slice(last, m.index).replace(link, (all, href) => `](${absoluteUrl(href, ctx)})`) + m[0]
        last = m.index + m[0].length
      }
      return out + line.slice(last).replace(link, (all, href) => `](${absoluteUrl(href, ctx)})`)
    })
    .join('\n')
}

/**
 * Prose (no fences): inline JSX becomes Markdown, lifted attributes become
 * "#n" tokens, and wrapper braces go. `stats` counts what changed.
 */
export function convertProse(input, ctx, stats) {
  const lines = input.split('\n')
  stats.unwrapped += unwrapBraceLines(lines)
  const text = lines.join('\n')
  const mask = codeMask(text)
  let out = ''
  let i = 0
  while (i < text.length) {
    if (!mask[i]) {
      if (text[i] === '<') {
        const r = convertTag(text, i, ctx)
        if (r) {
          out += r.text
          i = r.end
          continue
        }
      } else if (text[i] === '{') {
        const r = braceToken(text, i)
        if (r) {
          out += r.text
          i = r.end
          continue
        }
      }
    }
    out += text[i]
    i++
  }
  return absolutizeLinks(out, ctx)
}

/** Splits a body into fenced blocks (kept verbatim) and prose chunks (converted). */
export function convertBody(body, ctx, stats) {
  const FENCE_OPEN = /^(\s*)(`{3,}|~{3,})(.*)$/
  const FENCE_CLOSE = /^\s*(`{3,}|~{3,})\s*$/
  const out = []
  let prose = []
  let fence = null
  const flush = () => {
    if (prose.length) out.push(convertProse(prose.join('\n'), ctx, stats))
    prose = []
  }
  for (const line of body.split('\n')) {
    if (fence) {
      out.push(line)
      const close = line.match(FENCE_CLOSE)
      if (close && close[1][0] === fence[0] && close[1].length >= fence.length) fence = null
      continue
    }
    const open = line.match(FENCE_OPEN)
    if (open && !(open[2][0] === '`' && open[3].includes('`'))) {
      flush()
      fence = open[2]
      out.push(line)
      continue
    }
    prose.push(line)
  }
  flush()
  return out.join('\n')
}
