/**
 * Prose pre-pass for primer-design, run on each body before the shared
 * converter. It turns the site's inline JSX and raw HTML into Markdown, so the
 * converter only meets block elements, which the hooks in hooks.mjs resolve.
 * Fenced code and `<Code>` examples are set aside first and restored verbatim.
 */

const BLOCK_NAMES = [
  'Box', 'Text', 'Caption', 'Heading', 'Note', 'Do', 'Dont', 'DoDontContainer',
  'StorybookEmbed', 'CustomVideoPlayer', 'ImageBox', 'ImageContainer', 'ChildPages',
  'ThemeReferenceTree', 'RailsProvider', 'StatusTable', 'Icons', 'AccessibilityLink',
]
/** Components that only ever sit inside a sentence or table cell. Their tags go; their text stays. */
const INLINE_WRAPPERS = ['Box', 'Text', 'Octicon', 'State', 'Label']
const SLOT = /\u0001([FC])(\d+)\u0001/g

/** Dedent a template literal's lines, dropping its leading and trailing blank lines. */
function dedent(body) {
  const lines = body.replace(/\s+$/, '').replace(/^\s*\n/, '').split('\n')
  const indents = lines.filter(line => line.trim()).map(line => line.match(/^\s*/)[0].length)
  const min = indents.length ? Math.min(...indents) : 0
  return lines.map(line => line.slice(min)).join('\n')
}

/** Replaces each fenced block with a placeholder line; returns the text and the blocks. */
function setAsideFences(text) {
  const lines = text.split('\n')
  const out = []
  const blocks = []
  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].match(/^\s*(`{3,}|~{3,})/)
    if (!open) {
      out.push(lines[i])
      continue
    }
    const mark = open[1]
    const block = [lines[i]]
    let j = i + 1
    for (; j < lines.length; j++) {
      block.push(lines[j])
      const close = lines[j].match(/^\s*(`{3,}|~{3,})\s*$/)
      if (close && close[1][0] === mark[0] && close[1].length >= mark.length) break
    }
    const indent = lines[i].search(/\S/)
    const normalized = block.map((line, k) => (k === 0 || k === block.length - 1 ? line.trimStart() : line.replace(new RegExp(`^ {0,${indent}}`), '')))
    blocks.push(normalized.join('\n'))
    out.push(`\u0001F${blocks.length - 1}\u0001`)
    i = j
  }
  return { text: out.join('\n'), blocks }
}

/** `<Code classname="language-jsx">{`...`}</Code>` becomes a fenced block: its template literal is the code. */
function setAsideCodeExamples(text, blocks) {
  return text.replace(/<Code\b([^<>]*)>\s*\{\s*`([\s\S]*?)`\s*\}\s*<\/Code>/g, (all, attrs, body) => {
    const lang = attrs.match(/language-([\w-]+)/)?.[1] ?? ''
    blocks.push(['```' + lang, dedent(body), '```'].join('\n'))
    return `\n\u0001C${blocks.length - 1}\u0001\n`
  })
}

function attr(attrs, name) {
  const m = attrs.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{\\s*(?:"([^"]*)"|'([^']*)')\\s*\\})`))
  if (!m) return null
  return m[1] ?? m[2] ?? m[3] ?? m[4]
}

/** The address a page's `href` or `to` points at, resolved to its live URL when the site has one. */
function resolveHref(href, env) {
  if (/^(https?:|mailto:|tel:)/.test(href)) return href
  if (href.startsWith('#')) return env.pageUrl + href
  const [pathPart, ...hashParts] = href.split('#')
  const hash = hashParts.length ? `#${hashParts.join('#')}` : ''
  if (!pathPart.startsWith('/')) return href
  const path = pathPart.replace(/\/+$/, '') || '/'
  return (env.liveFor(path) ?? env.siteUrl + path) + hash
}

function convertIcons(text) {
  return text.replace(/<[A-Z]\w*Icon\b[^<>]*\/>/g, '')
}

function convertKeyboardKeys(text) {
  return text.replace(/<KeyboardKey\b[^<>]*>([\s\S]*?)<\/KeyboardKey>/g, '$1')
}

function convertImages(text) {
  return text.replace(new RegExp(String.raw`<img\b${OPEN_ATTRS}\/?>`, 'g'), (all, attrs) => {
    const alt = (attr(attrs, 'alt') ?? '').trim()
    if (!alt) return '' // no alt text means a decorative image; nothing to keep
    const src = attr(attrs, 'src')
    return `![${alt}](${src ?? ''})`
  })
}

/** Attributes of an opening tag: stops before a self-closing `/>`, so `<Link />` never pairs with a later closer. */
const OPEN_ATTRS = String.raw`((?:[^<>{\/]|\/(?!>)|\{[^{}]*\})*)`

function convertLinks(text, env) {
  return text.replace(new RegExp(String.raw`<(Link|a)\b${OPEN_ATTRS}>([\s\S]*?)<\/\1>`, 'g'), (all, tag, attrs, inner) => {
    const label = inner.replace(/<[^<>]+>/g, '').replace(/\s+/g, ' ').trim()
    const href = attr(attrs, 'href') ?? attr(attrs, 'to')
    if (!href) return label
    return `[${label}](${resolveHref(href, env)})`
  })
}

function convertEmphasis(text) {
  return text
    .replace(/<(em|i)>([\s\S]*?)<\/\1>/g, '*$2*')
    .replace(/<(strong|b)>([\s\S]*?)<\/\1>/g, '**$2**')
}

/** Inline wrappers and layout tags go; their text stays. Block-level lines are left alone. */
function stripWrappers(text) {
  const blockStart = new RegExp(`^\\s*<\\/?(${BLOCK_NAMES.join('|')})\\b`)
  const inline = new RegExp(`<\\/?(${INLINE_WRAPPERS.join('|')})\\b[^<>]*>`, 'g')
  const html = /<\/?(?:div|span|p|figure|figcaption|center|section|article|picture|label)\b[^<>]*>/g
  return text
    .split('\n')
    .map(line => {
      const cleaned = line.replace(html, '')
      return blockStart.test(cleaned) ? cleaned : cleaned.replace(inline, '')
    })
    .join('\n')
}

function convertDetails(text) {
  return text
    .replace(/<summary\b[^<>]*>([\s\S]*?)<\/summary>/g, '**$1**')
    .replace(/<\/?details\b[^<>]*>/g, '')
}

function convertHeadings(text) {
  return text
    .split('\n')
    .flatMap(line => {
      const m = line.match(/^(\s*)<h([1-6])\b[^<>]*>([\s\S]*?)<\/h\2>(.*)$/)
      if (!m) return [line]
      const head = `${'#'.repeat(Number(m[2]))} ${m[3].trim()}`
      return m[4].trim() ? [head, '', m[4].trim()] : [head]
    })
    .join('\n')
}

function convertLists(text) {
  return text
    .replace(/<\/?(ul|ol)\b[^<>]*>/g, '')
    .replace(/\s*<li\b[^<>]*>/g, '\n- ')
    .replace(/<\/li>/g, '')
}

function convertBreaks(text) {
  return text
    .split('\n')
    .map(line => {
      if (/^\s*\|/.test(line)) return line
      return line.replace(/\s*<br\s*\/?>\s*$/, '').replace(/<br\s*\/?>/g, ' ')
    })
    .join('\n')
}

/** Markdown links to site paths go to their live URLs; `#anchors` point at this page. */
function convertMarkdownLinks(text, env) {
  return text.replace(/\]\((\/[^)\s]*|#[^)\s]*)\)/g, (all, target) => {
    return `](${resolveHref(target, env)})`
  })
}

/** Index just past the `>` that ends an opening tag, skipping `{...}` and quoted values; -1 if the line ends first. */
function tagEnd(line, from) {
  let depth = 0
  let quote = null
  for (let i = from; i < line.length; i++) {
    const ch = line[i]
    if (quote) {
      if (ch === quote) quote = null
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === '{') depth++
    else if (ch === '}') depth--
    else if (ch === '>' && depth === 0) return i + 1
  }
  return -1
}

/**
 * Block lines split so the converter can find each element's closer. The
 * converter's closer search counts a `<Box>text</Box>` on one line as an open
 * tag that never closes, so such lines become three lines. Text after a
 * closer moves to its own line too, because the converter drops it.
 */
function splitBlockLine(line) {
  const open = line.match(/^(\s*)<([A-Z][\w.]*)\b/)
  if (!open) return [line]
  const indent = open[1]
  const name = open[2]
  const end = tagEnd(line, indent.length)
  if (end === -1) return [line]
  if (line.slice(0, end).endsWith('/>')) {
    const rest = line.slice(end).trim()
    return rest ? [line.slice(0, end), ...splitBlockLine(rest)] : [line]
  }
  const closer = `</${name}>`
  const at = line.lastIndexOf(closer)
  if (at < end) return [line]
  const inner = line.slice(end, at).trim()
  const tail = line.slice(at + closer.length).trim()
  const out = [line.slice(0, end)]
  if (inner) out.push(...splitBlockLine(inner).map(part => (part.startsWith(indent) ? part : indent + part.trimStart())))
  out.push(`${indent}${closer}`)
  if (tail) out.push(...splitBlockLine(tail))
  return out
}

const SLOT_LINE = /^\u0001[FC]\d+\u0001$/

const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s/

/**
 * Indentation the JSX nesting left behind would read as an indented code
 * block. Within each run of consecutive prose lines (a blank line or a
 * set-aside block ends a run), list items keep their nesting, measured from the
 * run's shallowest item, and every other line starts at the margin.
 */
function dedentRuns(text) {
  const out = []
  let run = []
  const flush = () => {
    const items = run.filter(line => LIST_ITEM.test(line)).map(line => line.match(/^ */)[0].length)
    const base = items.length ? Math.min(...items) : 0
    for (const line of run) out.push(LIST_ITEM.test(line) ? line.slice(base) : line.trimStart())
    run = []
  }
  for (const line of text.split('\n')) {
    if (!line.trim() || SLOT_LINE.test(line)) {
      flush()
      out.push(SLOT_LINE.test(line) ? line : '')
    } else run.push(line)
  }
  flush()
  return out.join('\n')
}

/** `<InlineCode>{"text"}</InlineCode>` and `<InlineCode>text</InlineCode>` are code spans. */
function convertInlineCode(text) {
  return text
    .replace(/<InlineCode\b[^<>]*>\s*\{\s*(['"])([\s\S]*?)\1\s*\}\s*<\/InlineCode>/g, (all, q, body) => `\`${body}\``)
    .replace(/<InlineCode\b[^<>]*>([\s\S]*?)<\/InlineCode>/g, (all, body) => `\`${body.trim()}\``)
}

/**
 * Prose transforms, in order. Each step either removes JSX that carries no
 * text, or turns it into the Markdown it stands for.
 */
export function convertProse(text, env) {
  let t = text
  t = t.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '') // {/* comments */}
  t = t.replace(/\{\s*(['"])\s\1\s*\}/g, ' ') // {' '} is a JSX space
  t = t.replace(/\{\s*`([^`\n]*)`\s*\}/g, '`$1`') // {`text`} is text shown as code
  t = t.replace(/^\s*<hr\s*\/?>\s*$/gm, '') // a rule has no text to keep
  t = convertIcons(t)
  t = convertKeyboardKeys(t)
  t = convertInlineCode(t)
  t = convertImages(t)
  t = convertLinks(t, env)
  t = convertEmphasis(t)
  t = convertDetails(t)
  t = stripWrappers(t)
  t = convertHeadings(t)
  t = convertLists(t)
  t = convertBreaks(t)
  t = convertMarkdownLinks(t, env)
  return dedentRuns(t.split('\n').flatMap(splitBlockLine).join('\n'))
}

/**
 * The page body with its prose converted. Fences and `<Code>` examples are
 * restored byte for byte after conversion.
 */
export function prepareProse(body, env) {
  const fences = setAsideFences(body.replace(/\r\n?/g, '\n'))
  const blocks = [...fences.blocks]
  const withCode = setAsideCodeExamples(fences.text, blocks)
  const converted = convertProse(withCode, env)
  return converted.replace(SLOT, (all, kind, index) => blocks[Number(index)]).replace(/\n{3,}/g, '\n\n')
}
