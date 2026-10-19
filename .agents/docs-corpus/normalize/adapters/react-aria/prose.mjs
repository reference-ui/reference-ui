/**
 * Prose pre-pass for the react-aria source, run before the shared converter. It touches only text
 * outside fenced code and outside backtick code spans. It removes multi-line MDX comments (licence
 * headers) and page <head> blocks; turns inline JSX a sentence cannot hold into Markdown (type and key
 * names, badges, icons, links); converts the lowercase HTML the MDX uses for layout (links, emphasis,
 * list items, images) and drops the structural and media tags that carry no text of their own; gives each
 * block element its own line (the converter keeps only the first of two elements on one line); and
 * resolves relative link targets to the page's live URL. Generated API text the clone does not hold
 * ({docs.exports.X...}) is removed, so no expression is left in the corpus.
 */

const FENCE_OPEN = /^(\s*)(`{3,}|~{3,})(.*)$/
const FENCE_CLOSE = /^\s*(`{3,}|~{3,})\s*$/
const MDX_COMMENT = /\{\s*\/\*[\s\S]*?\*\/\s*\}/g
const HEAD_BLOCK = /<head\b[^>]*>[\s\S]*?<\/head>/g
const CODE_SPAN = /(`+)[\s\S]*?\1/g
const LINK = /(!?\[[^\]\n]*\])\(([^)\s]+)((?:\s+"[^"\n]*")?)\)/g
const TYPE_LINK = /<TypeLink\b((?:[^<>{}]|\{[^{}]*\})*?)\/>/g
const KEYBOARD = /<Keyboard\b[^<>]*>([^<>{}]*)<\/Keyboard>/g
const EXPORT_SPREAD = /\{\.\.\.\w+\.exports\.(\w+)\}/g
const DOCS_EXPR = /(?<=>)\{docs\.exports\.[\w.]+\}(?=<)/g
const VERSION_BADGE = /<VersionBadge\b[^<>]*?version="([^"]*)"[^<>]*\/>/g
const LINK_ELEMENT = /<Link\b([^<>]*)>([^<>]*)<\/Link>/g
const COMMAND = /<Command\b[^<>]*?command="([^"]*)"[^<>]*\/>/g
const INLINE_DROP = /<(?:PendingBadge|ChevronRight|ChevronDown|ChevronLeft|ArrowRight|ArrowLeft|Plus|Star|Bell|Minus|Search|Settings|User|Copy|Cut|Paste|MoreHorizontal|Ellipsis|Pencil|Trash|Mail|Smartphone|Instagram|FolderOpen|Pin|Upload|Counter|Parcel|Nextjs|ReactRouter|Vite|Webpack|Rollup|ESBuild)\b[^<>]*\/>/g
const INLINE_WRAP = /<(GradientText|Text)\b[^<>]*>([^<>]*)<\/\1>/g
const BLOCK_SELF_CLOSING = /^(\s*<[A-Z][\w.]*(?:\s(?:[^<>{}]|\{[^{}]*\})*?)?\/>)\s*(\S.*)$/
const BLOCK_CLOSERS = /(?<=\S)(<\/(?:Content|InlineAlert|Step|StepList|Card|CardGroup|TabPanel|TabPanels|Disclosure|DisclosurePanel|Figure|Section)>)/g

const ATTRS = '(?:[^<>{}]|\\{(?:[^{}]|\\{[^{}]*\\})*\\})*'
const HTML_IMG = new RegExp(`<img\\b(${ATTRS})\\/?>`, 'g')
const HTML_LINK = new RegExp(`<a\\b(${ATTRS})>([^<]*?)<\\/a>`, 'g')
const HTML_TAG_DROP = new RegExp(
  `<\\/?(?:video|iframe|picture|source|track|meta|link|style|script|details|ul|ol|li|figure|figcaption|section|div|span|p|sub|sup|br|hr|svg|g|path|rect|text|header|footer|article|main|nav|aside|label|small|mark|kbd|abbr|font|center|object|embed|canvas|defs|circle|line|polyline|polygon|ellipse|use|body|html|marker|path)(?:\\s${ATTRS})?\\/?>`,
  'g'
)

/** Lines split into fenced blocks (`code: true`) and prose runs (`code: false`). */
export function splitFences(text) {
  const lines = text.split('\n')
  const out = []
  let prose = []
  let i = 0
  while (i < lines.length) {
    const open = lines[i].match(FENCE_OPEN)
    if (open && !(open[2][0] === '`' && open[3].includes('`'))) {
      if (prose.length) out.push({ code: false, lines: prose })
      prose = []
      const mark = open[2]
      const block = [lines[i]]
      let j = i + 1
      for (; j < lines.length; j++) {
        block.push(lines[j])
        const close = lines[j].match(FENCE_CLOSE)
        if (close && close[1][0] === mark[0] && close[1].length >= mark.length) break
      }
      out.push({ code: true, lines: block })
      i = j + 1
      continue
    }
    prose.push(lines[i])
    i++
  }
  if (prose.length) out.push({ code: false, lines: prose })
  return out
}

/** Applies fn to the text outside backtick code spans only. */
function mapOutsideSpans(text, fn) {
  let out = ''
  let last = 0
  let m
  CODE_SPAN.lastIndex = 0
  while ((m = CODE_SPAN.exec(text))) {
    out += fn(text.slice(last, m.index)) + m[0]
    last = m.index + m[0].length
  }
  return out + fn(text.slice(last))
}

/** The last dotted segment of a type expression: `typesDocs.exports.PressEvent` is `PressEvent`. */
function typeName(attrs) {
  const m = attrs.match(/\btype=\{([^}]*)\}/)
  if (!m) return ''
  return m[1].trim().split('.').pop()
}

/** Resolves a link target against the page's live URL (the browser's rule). */
function resolveTarget(target, pageUrl) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.includes('{') || target.includes('<')) return target
  if (target.startsWith('#')) return `${pageUrl}${target}`
  try {
    return new URL(target, pageUrl).href
  } catch {
    return target
  }
}

/** Inline JSX and HTML rewrites on text outside code spans. */
function inlineText(part, pageUrl) {
  let next = part.replace(TYPE_LINK, (_, attrs) => {
    const name = typeName(attrs)
    return name ? `\`${name}\`` : `\`${attrs.trim()}\``
  })
  next = next.replace(DOCS_EXPR, '').replace(/\s[–-]\s*$/, '')
  next = next.replace(EXPORT_SPREAD, (_, name) => ` exportSpread="${name}"`)
  next = next.replace(KEYBOARD, (_, key) => `\`${key}\``)
  next = next.replace(VERSION_BADGE, (_, version) => `(${version})`)
  next = next.replace(COMMAND, (_, command) => `\`${command}\``)
  next = next.replace(LINK_ELEMENT, (_, attrs, label) => {
    const href = attrs.match(/\bhref="([^"]*)"/)
    return href ? `[${label}](${resolveTarget(href[1], pageUrl)})` : label
  })
  next = next.replace(INLINE_WRAP, (_, _name, text) => text)
  next = next.replace(INLINE_DROP, '')
  next = next.replace(HTML_IMG, (_, attrs) => {
    const alt = attrs.match(/\balt="([^"]*)"/)
    const src = attrs.match(/\bsrc="([^"]*)"/)
    return src ? `![${alt ? alt[1] : ''}](${resolveTarget(src[1], pageUrl)})` : ''
  })
  next = next.replace(HTML_LINK, (_, attrs, label) => {
    const href = attrs.match(/\bhref="([^"]*)"/)
    return href && label.trim() ? `[${label.trim()}](${resolveTarget(href[1], pageUrl)})` : label
  })
  next = next.replace(/<(strong|b)>([^<]*?)<\/\1>/g, (_, _t, text) => `**${text}**`)
  next = next.replace(/<(em|i)>([^<]*?)<\/\1>/g, (_, _t, text) => `*${text}*`)
  next = next.replace(/<code>([^<]*?)<\/code>/g, (_, text) => `\`${text}\``)
  next = next.replace(/<summary\b[^<>]*>([^<]*?)<\/summary>/g, (_, text) => `**${text.trim()}**`)
  next = next.replace(/<li\b[^<>]*>/g, '- ').replace(/<\/li>/g, '')
  next = next.replace(HTML_TAG_DROP, '')
  next = next.replace(/<h([1-6])\b[^<>]*>([^<]*?)<\/h\1>/g, (_, level, text) => `${'#'.repeat(Math.max(2, Number(level)))} ${text.trim()}`)
  return next.replace(LINK, (_, label, target, title) => `${label}(${resolveTarget(target, pageUrl)}${title})`)
}

/**
 * Block siblings on one line (<Tab>..</Tab><Tab>..</Tab>, <TabList><Tab>..): the converter keeps only the
 * first, so each block-level element goes on its own line. Only tag-to-tag gaps split; inline text does not.
 */
const BLOCK_NAMES =
  'Tab|TabPanel|TabList|TabPanels|Tabs|Step|StepList|Card|CardGroup|CardTitle|CardDescription|Content|InlineAlert|Disclosure|DisclosureTitle|DisclosurePanel|Figure|Section|Callout'
const BLOCK_SIBLINGS = new RegExp(`(?<=<\\/(?:${BLOCK_NAMES})>|<(?:${BLOCK_NAMES})>)\\s*(?=<\\/?(?:${BLOCK_NAMES})\\b)`, 'g')

/** A block element and the text after it on one line become two lines (the converter keeps the first only). */
function splitBlockLine(line) {
  const m = line.match(BLOCK_SELF_CLOSING)
  return m ? [m[1], m[2]] : [line]
}

/** A closing block tag that follows text on its line starts its own line. */
function splitClosers(line) {
  return line.replace(BLOCK_CLOSERS, '\n$1').replace(BLOCK_SIBLINGS, '\n').split('\n')
}

/** The body the converter gets: comments and head blocks removed, inline elements and links resolved. */
export function prepareProse(text, pageUrl) {
  return splitFences(text)
    .map(block => {
      if (block.code) return block.lines.join('\n')
      const joined = block.lines.join('\n').replace(MDX_COMMENT, '').replace(HEAD_BLOCK, '')
      return dropDemoDivs(joined.split('\n'))
        .filter(line => !/^\s*\{[^{}]*\}\s*$/.test(line) && !/^\s*\/\*.*\*\/\s*$/.test(line))
        .flatMap(line => splitClosers(line))
        .flatMap(splitBlockLine)
        .map(line => mapOutsideSpans(line, part => inlineText(part, pageUrl)))
        .join('\n')
    })
    .join('\n')
}

/**
 * Live demo markup written as <div style|className|role=...> straight into the MDX (colour wheels, layout
 * diagrams) is dropped with its whole element: it has no prose of its own. A <div> block with six or more
 * words of prose outside its tags is kept (the tags go, the text stays).
 */
function dropDemoDivs(lines) {
  const out = []
  let i = 0
  while (i < lines.length) {
    if (!/^\s*<div\b(?=[^<>]*?(?:style|className|role)=)/.test(lines[i])) {
      out.push(lines[i])
      i++
      continue
    }
    let depth = divDelta(lines[i])
    const block = [lines[i]]
    let j = i + 1
    while (depth > 0 && j < lines.length) {
      block.push(lines[j])
      depth += divDelta(lines[j])
      j++
    }
    if (proseWords(block) >= 6) out.push(...block)
    i = j
  }
  return out
}

/** Words of prose in lines: text outside tags and outside {expressions}, which may nest deeply in JSX attributes. */
function proseWords(lines) {
  let text = ''
  let inTag = false
  let expr = 0
  for (const ch of lines.join(' ')) {
    if (inTag) {
      if (ch === '{') expr++
      else if (ch === '}') expr = Math.max(0, expr - 1)
      else if (ch === '>' && expr === 0) inTag = false
      continue
    }
    if (ch === '<') inTag = true
    else if (ch === '{') expr++
    else if (ch === '}') expr = Math.max(0, expr - 1)
    else if (expr === 0) text += ch
  }
  return (text.match(/[A-Za-z][A-Za-z'’-]+/g) ?? []).length
}

/** Net open <div>s on a line: a <div ... /> opens and closes on the same line, so it counts as none. */
function divDelta(line) {
  const opens = (line.match(/<div\b/g) ?? []).length
  const closes = (line.match(/<\/div>/g) ?? []).length
  const selfClosed = opens > 0 && /\/>\s*$/.test(line) ? 1 : 0
  return opens - selfClosed - closes
}
