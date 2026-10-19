/**
 * MDX to plain Markdown. Fenced code is kept verbatim. Every JSX element is
 * parsed (attributes, nesting, closers anywhere on a line, text after a
 * closer) and then rendered in this order: an adapter's `components` hook,
 * then, for block elements, imported demos and the built-in renderers, then
 * the unresolved marker. Directive containers (:::note and friends) become
 * blockquotes after rendering, in MDX and in Markdown alike.
 */

import { dirname, extname, resolve } from 'node:path'

const MAX_STATEMENT_LINES = 200
const CALLOUT_KIND = { warning: 'Warning', warn: 'Warning', danger: 'Caution', error: 'Caution' }
const DIRECTIVE_KIND = { note: 'Note', info: 'Info', tip: 'Tip', warning: 'Warning', caution: 'Caution', danger: 'Danger' }
const DIRECTIVE_OPEN = /^:::(note|info|tip|warning|caution|danger)(?:\[([^\]]*)\])?[ \t]*$/
const DIRECTIVE_END = /^:::[ \t]*$/
const LANG_BY_EXT = { '.tsx': 'tsx', '.ts': 'ts', '.jsx': 'jsx', '.js': 'js', '.mjs': 'js', '.css': 'css', '.html': 'html', '.json': 'json' }
const IMPORT_LINE = /^import\s+(\w+)\s+from\s+['"](\.[^'"]+)['"]/gm
const MARKER = /<!-- unresolved: ([^>]+?) -->/g
const PAIR = { '{': '}', '[': ']', '(': ')' }
const SPECIAL = /[`{<\n]/g
const COMPONENT_NAME = /^[A-Z][\w.]*/
const PARAGRAPH_BREAK = /\n[ \t]*\n/g

/** The fence mark (``` or ~~~) that opens on this line, or null. Quoted: may sit behind `>`. */
function fenceOpenMark(line, quoted = false) {
  const m = (quoted ? /^[ \t>]*(`{3,}|~{3,})(.*)$/ : /^[ \t]*(`{3,}|~{3,})(.*)$/).exec(line)
  if (!m) return null
  if (m[1][0] === '`' && m[2].includes('`')) return null
  return m[1]
}

/** Whether this line closes a fence that was opened with `mark`. */
function fenceCloses(line, mark, quoted = false) {
  const m = (quoted ? /^[ \t>]*(`{3,}|~{3,})[ \t]*$/ : /^[ \t]*(`{3,}|~{3,})[ \t]*$/).exec(line)
  return Boolean(m && m[1][0] === mark[0] && m[1].length >= mark.length)
}

function bracketDelta(line) {
  let delta = 0
  for (const ch of line) {
    if (ch === '{' || ch === '[' || ch === '(') delta++
    else if (ch === '}' || ch === ']' || ch === ')') delta--
  }
  return delta
}

/**
 * Last line of the import/export statement that starts at `i`, or -1. An
 * import only counts when it closes with `from '<module>'` (or is a bare
 * `import '<module>'`), so prose that starts with "import" is left alone.
 */
function statementEnd(lines, i) {
  const first = lines[i]
  const isImport = /^import\s/.test(first)
  if (!isImport && !/^export\s+(const|let|var|function|default|async|class|type|interface|\{)/.test(first)) return -1
  let depth = 0
  let text = ''
  for (let j = i; j < lines.length && j < i + MAX_STATEMENT_LINES; j++) {
    const line = lines[j]
    if (j > i && depth <= 0 && line.trim() === '') return -1
    depth += bracketDelta(line)
    text += `${line}\n`
    if (depth > 0) continue
    if (!isImport) return j
    const t = text.trim()
    const closes = /\bfrom\s+(['"])[^'"\n]*\1;?$/.test(t) || /^import\s+(['"])[^'"\n]*\1;?$/.test(t)
    return closes ? j : -1
  }
  return -1
}

/** Drops top-level import and export statements, including multi-line ones. Fences are left alone. */
export function stripModuleStatements(text) {
  const lines = text.split('\n')
  const out = []
  let mark = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (mark) {
      out.push(line)
      if (fenceCloses(line, mark)) mark = null
      continue
    }
    const open = fenceOpenMark(line)
    if (open) {
      mark = open
      out.push(line)
      continue
    }
    const end = statementEnd(lines, i)
    if (end !== -1) {
      i = end
      continue
    }
    out.push(line)
  }
  return out.join('\n')
}

/** Index just past the bracket that closes the one at `i` (a `{`, `[` or `(`). Throws when unbalanced. */
function readBalanced(s, i) {
  const stack = []
  let quote = null
  for (let j = i; j < s.length; j++) {
    const ch = s[j]
    if (quote) {
      if (ch === '\\') j++
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch
      continue
    }
    if (ch === '{' || ch === '[' || ch === '(') {
      stack.push(ch)
      continue
    }
    if (ch === '}' || ch === ']' || ch === ')') {
      if (PAIR[stack.pop()] !== ch) throw new Error(`unbalanced '${ch}' in an attribute expression`)
      if (stack.length === 0) return j + 1
    }
  }
  throw new Error('unterminated attribute expression')
}

/**
 * The attributes of one opening tag, given the text between its name and its
 * `>`. A quoted value is its text; a `{...}` value is the raw expression, so
 * deep objects and arrays arrive whole. Throws on unbalanced input.
 */
export function parseAttrs(raw) {
  const s = String(raw)
  const attrs = {}
  let spreads = 0
  let i = 0
  const skipSpace = () => {
    while (i < s.length && /\s/.test(s[i])) i++
  }
  for (;;) {
    skipSpace()
    if (i >= s.length) return attrs
    if (s[i] === '{') {
      const end = readBalanced(s, i)
      attrs[`...${spreads++}`] = s.slice(i + 1, end - 1).trim()
      i = end
      continue
    }
    const name = /^[A-Za-z_][\w:.-]*/.exec(s.slice(i, i + 256))?.[0]
    if (!name) throw new Error(`unexpected '${s[i]}' in attributes`)
    i += name.length
    skipSpace()
    if (s[i] !== '=') {
      attrs[name] = true
      continue
    }
    i++
    skipSpace()
    const c = s[i]
    if (c === '"' || c === "'") {
      const end = s.indexOf(c, i + 1)
      if (end === -1) throw new Error(`unterminated string for ${name}`)
      attrs[name] = s.slice(i + 1, end)
      i = end + 1
      continue
    }
    if (c === '{') {
      const end = readBalanced(s, i)
      attrs[name] = s.slice(i + 1, end - 1).trim()
      i = end
      continue
    }
    throw new Error(`attribute ${name} needs a quoted or {expression} value`)
  }
}

/**
 * The strings in an array or string expression such as `['a', "b", \`c\`]`,
 * in order. Hooks use it on list props: `stringList(props.groups)`. A template
 * with `${}` is refused rather than guessed at.
 */
export function stringList(expression) {
  const s = String(expression ?? '')
  const out = []
  let i = 0
  while (i < s.length) {
    const quote = s[i]
    if (quote !== "'" && quote !== '"' && quote !== '`') {
      i++
      continue
    }
    let value = ''
    let j = i + 1
    while (j < s.length && s[j] !== quote) {
      if (s[j] === '\\' && j + 1 < s.length) {
        value += s[j + 1]
        j += 2
        continue
      }
      if (quote === '`' && s[j] === '$' && s[j + 1] === '{') {
        throw new Error('template interpolation is not supported in a string list')
      }
      value += s[j]
      j++
    }
    if (j >= s.length) throw new Error('unterminated string in a list')
    out.push(value)
    i = j + 1
  }
  return out
}

/** A tag header may run past a blank line, as the source does; a cap keeps a stray `<Name` in prose from swallowing the page. */
const HEADER_LIMIT = 4000

/**
 * Raw text of an opening tag's attributes, up to its `>` at bracket depth 0.
 * Null when no `>` closes within HEADER_LIMIT characters (the `<` is text).
 * Throws when brackets are still open at the end of that window.
 */
function scanHeader(s, from) {
  const stack = []
  let quote = null
  const limit = Math.min(s.length, from + HEADER_LIMIT)
  for (let j = from; j < limit; j++) {
    const ch = s[j]
    if (quote) {
      if (ch === '\\') j++
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch
      continue
    }
    if (ch === '{' || ch === '[' || ch === '(') {
      stack.push(ch)
      continue
    }
    if (ch === '}' || ch === ']' || ch === ')') {
      if (PAIR[stack.pop()] !== ch) throw new Error(`unexpected '${ch}' in a tag`)
      continue
    }
    if (ch === '>' && stack.length === 0) return { end: j + 1, raw: s.slice(from, j) }
  }
  if (stack.length && limit === s.length) throw new Error('unbalanced bracket in a tag')
  return null
}

/** The JSX tag that starts at `i` (a `<`), or null when the text there is not a tag. */
function readTag(s, i) {
  let p = i + 1
  const closing = s[p] === '/'
  if (closing) p++
  let name = COMPONENT_NAME.exec(s.slice(p, p + 256))?.[0]
  if (!name && s.startsWith('summary', p) && !/[\w.]/.test(s[p + 7] ?? '')) name = 'summary'
  if (!name) return null
  let q = p + name.length
  if (closing) {
    while (s[q] === ' ' || s[q] === '\t') q++
    return s[q] === '>' ? { closing: true, name, end: q + 1 } : null
  }
  const header = scanHeader(s, q)
  if (!header) return null
  const selfClosing = /\/\s*$/.test(header.raw)
  const raw = selfClosing ? header.raw.replace(/\/\s*$/, '') : header.raw
  return { closing: false, name, attrs: parseAttrs(raw), selfClosing, end: header.end }
}

/** End (exclusive) of the inline code span whose backticks start at `i`, or -1 when none closes in its paragraph. */
function codeSpanEnd(s, i) {
  let n = 0
  while (s[i + n] === '`') n++
  PARAGRAPH_BREAK.lastIndex = i
  const brk = PARAGRAPH_BREAK.exec(s)
  const limit = brk ? brk.index : s.length
  let j = i + n
  for (;;) {
    const k = s.indexOf('`', j)
    if (k === -1 || k >= limit) return -1
    let run = 0
    while (s[k + run] === '`') run++
    if (run === n) return k + run
    j = k + run
  }
}

/** Whether position `i` starts a line (only spaces or tabs before it). */
function atLineStart(s, i) {
  for (let k = i - 1; k >= 0; k--) {
    const c = s[k]
    if (c === '\n') return true
    if (c !== ' ' && c !== '\t') return false
  }
  return true
}

/** A fenced block whose opening line starts at `i`. The body loses the opener's indent. */
function readFence(s, i) {
  const eol = s.indexOf('\n', i)
  const first = s.slice(i, eol === -1 ? s.length : eol)
  const mark = fenceOpenMark(first)
  if (!mark) return null
  const indent = first.length - first.trimStart().length
  const info = first.trim().slice(mark.length).trim()
  const body = []
  let pos = eol === -1 ? s.length : eol + 1
  while (pos < s.length) {
    const nl = s.indexOf('\n', pos)
    const line = s.slice(pos, nl === -1 ? s.length : nl)
    if (fenceCloses(line, mark)) return { mark, info, body, end: nl === -1 ? s.length : nl }
    body.push(line.replace(new RegExp(`^ {0,${indent}}`), ''))
    pos = nl === -1 ? s.length : nl + 1
  }
  return { mark, info, body, end: s.length }
}

/**
 * Parses text from `cur.i` into nodes until the closer for `closeName`.
 * A closer that belongs to an outer element is left unconsumed, so that
 * element closes at it. `closed` says whether this level found its own closer.
 */
function parseLevel(cur, openNames, closeName) {
  const s = cur.s
  const nodes = []
  let text = ''
  const flush = () => {
    if (text) nodes.push({ kind: 'text', s: text })
    text = ''
  }
  while (cur.i < s.length) {
    const i = cur.i
    if (i === 0 || s[i - 1] === '\n') {
      const fence = readFence(s, i)
      if (fence) {
        flush()
        nodes.push({ kind: 'fence', mark: fence.mark, info: fence.info, body: fence.body })
        cur.i = fence.end
        continue
      }
    }
    SPECIAL.lastIndex = i
    const hit = SPECIAL.exec(s)
    if (!hit || hit.index > i) {
      const next = hit ? hit.index : s.length
      text += s.slice(i, next)
      cur.i = next
      continue
    }
    const ch = s[i]
    if (ch === '\n') {
      text += ch
      cur.i = i + 1
      continue
    }
    if (ch === '`') {
      const end = codeSpanEnd(s, i)
      if (end === -1) {
        text += ch
        cur.i = i + 1
      } else {
        text += s.slice(i, end)
        cur.i = end
      }
      continue
    }
    if (ch === '{') {
      const close = s.startsWith('{/*', i) ? s.indexOf('*/}', i + 3) : -1
      if (close !== -1) {
        cur.i = close + 3
        continue
      }
      text += ch
      cur.i = i + 1
      continue
    }
    let tag = readTag(s, i)
    // HTML's <summary> opens a block element only at the start of a line; inline it is text, as before.
    if (tag && !tag.closing && tag.name === 'summary' && !atLineStart(s, i)) tag = null
    if (!tag) {
      text += ch
      cur.i = i + 1
      continue
    }
    if (tag.closing) {
      if (tag.name === closeName) {
        flush()
        cur.i = tag.end
        return { nodes, closed: true }
      }
      if (openNames.includes(tag.name)) {
        flush()
        return { nodes, closed: false }
      }
      // A stray </summary> is HTML text, as before; any other stray closer is marked.
      if (tag.name === 'summary') {
        text += s.slice(i, tag.end)
        cur.i = tag.end
        continue
      }
      flush()
      nodes.push({ kind: 'stray', name: tag.name })
      cur.i = tag.end
      continue
    }
    flush()
    const block = atLineStart(s, i)
    if (tag.selfClosing) {
      nodes.push({ kind: 'el', name: tag.name, attrs: tag.attrs, children: [], block })
      cur.i = tag.end
      continue
    }
    cur.i = tag.end
    const inner = parseLevel(cur, [...openNames, tag.name], tag.name)
    nodes.push({ kind: inner.closed ? 'el' : 'open', name: tag.name, attrs: tag.attrs, children: inner.nodes, block })
  }
  flush()
  return { nodes, closed: false }
}

/** Indent width in characters: spaces and tabs both count, as the dedent always has. */
function leadingSpaces(line) {
  return /^[ \t]*/.exec(line)[0].length
}

/** Smallest indent of a non-blank text line that starts a line inside these nodes. */
function minIndent(nodes) {
  let min = Infinity
  const visit = list => {
    for (const node of list) {
      if (node.kind === 'text') {
        const parts = node.s.split('\n')
        for (let k = 1; k < parts.length; k++) {
          if (parts[k].trim() !== '') min = Math.min(min, leadingSpaces(parts[k]))
        }
      } else if (node.kind === 'el' || node.kind === 'open') {
        visit(node.children)
      }
    }
  }
  visit(nodes)
  return min
}

function stripIndent(nodes, width) {
  const re = new RegExp(`\\n[ \\t]{0,${width}}`, 'g')
  for (const node of nodes) {
    if (node.kind === 'text') node.s = node.s.replace(re, '\n')
    else if (node.kind === 'el' || node.kind === 'open') stripIndent(node.children, width)
  }
}

/**
 * A block element's content is indented with the element. Take the smallest
 * indent of its lines off the whole subtree, top down, so nested blocks read
 * as the Markdown they are. Fence bodies are already normalized.
 */
function dedentTree(nodes) {
  for (const node of nodes) {
    if (node.kind !== 'el' && node.kind !== 'open') continue
    if (node.block && node.children.length) {
      const width = minIndent(node.children)
      if (Number.isFinite(width) && width > 0) stripIndent(node.children, width)
    }
    dedentTree(node.children)
  }
}

/** Prose transform that skips inline code spans. */
function mapProse(line, fn) {
  let out = ''
  let last = 0
  const span = /(`+)[\s\S]*?\1/g
  let m
  while ((m = span.exec(line))) {
    out += fn(line.slice(last, m.index)) + m[0]
    last = m.index + m[0].length
  }
  return out + fn(line.slice(last))
}

function absoluteLinks(text, siteUrl) {
  return siteUrl ? text.replace(/\]\(\//g, `](${siteUrl}/`) : text
}

/** The marker for an element nothing resolved. Counts are taken from the finished Markdown. */
function unresolved(name) {
  return `<!-- unresolved: ${name} -->`
}

/** Unresolved-component counts, read from finished Markdown so nothing counts twice. */
export function countUnresolved(markdown) {
  const counts = new Map()
  for (const m of markdown.matchAll(MARKER)) counts.set(m[1], (counts.get(m[1]) ?? 0) + 1)
  return counts
}

function fenced(mark, info, body) {
  return [`${mark}${info}`, ...body, mark]
}

/** Markdown for a node list: a string with its line breaks. */
function renderSeq(nodes, ctx) {
  let out = ''
  let afterBlock = false
  for (const node of nodes) {
    if (node.kind === 'text') {
      const text = afterBlock ? node.s.replace(/^[ \t]+/, '') : node.s
      out += mapProse(text, seg => absoluteLinks(seg, ctx.siteUrl))
      afterBlock = false
      continue
    }
    afterBlock = false
    if (node.kind === 'fence') {
      out += `\n${fenced(node.mark, node.info, node.body).join('\n')}\n`
    } else if (node.kind === 'stray') {
      out += unresolved(`/${node.name}`)
    } else {
      const rendered = renderElement(node, ctx)
      out += rendered.text
      afterBlock = rendered.block
    }
  }
  return out
}

function linesOf(nodes, ctx) {
  return collapseBlankLines(renderSeq(nodes, ctx)).replace(/^\n+|\n+$/g, '').split('\n')
}

/** Order: adapter hook, then (block only) demo import or built-in renderer, then the marker. */
function renderElement(node, ctx) {
  const block = Boolean(node.block)
  if (node.kind === 'el' && Object.hasOwn(ctx.components, node.name)) {
    const md = callHook(node, ctx, block)
    if (md !== null) return { block, text: block ? `\n\n${md}\n\n` : md }
  } else if (node.kind === 'el' && block) {
    const lines = blockLines(node, ctx)
    if (lines) return { block: true, text: `\n\n${lines.join('\n')}\n\n` }
  }
  return fallback(node, ctx, block)
}

/** An adapter hook's Markdown, or null when it declines (null or undefined). */
function callHook(node, ctx, block) {
  // Blocks are wrapped in blank lines, so a run of them between children is one blank line here.
  const children = collapseBlankLines(renderSeq(node.children, ctx)).trim()
  const scope = { file: ctx.file, siteUrl: ctx.siteUrl, readImport: ctx.readImport, root: ctx.root, inline: !block }
  let md
  try {
    md = ctx.components[node.name](node.attrs, children, scope)
  } catch (err) {
    throw new Error(`component ${node.name}: ${err.message}`)
  }
  if (md === null || md === undefined) return null
  return block ? String(md).replace(/^\n+|\n+$/g, '') : String(md)
}

function blockLines(node, ctx) {
  if (Object.hasOwn(ctx.imports, node.name)) return demoLines(node, ctx)
  if (Object.hasOwn(RENDERERS, node.name)) return RENDERERS[node.name](node, ctx)
  return null
}

/** Unmapped element: the marker, with its content kept. Block elements keep their blocks. */
function fallback(node, ctx, block) {
  const marker = unresolved(node.name)
  if (block) return { block: true, text: `\n\n${marker}\n\n${renderSeq(node.children, ctx)}\n\n` }
  return { block: false, text: `${marker}${renderSeq(node.children, ctx)}` }
}

function demoLines(node, ctx) {
  const path = resolve(dirname(ctx.file || '.'), ctx.imports[node.name])
  const source = ctx.readImport(path)
  if (source == null) return null
  const lang = LANG_BY_EXT[extname(path)] ?? ''
  return fenced('```', lang, source.replace(/\n$/, '').split('\n'))
}

const quoteLine = line => (line.trim() ? `> ${line}` : '>')

function isPlainLine(line) {
  return !/^(```|~~~|[-*+]\s|\d+\.\s|#|\||>|<)/.test(line.trim())
}

/** One blank line where a run of them was: quoted blanks inside a block should not stack. */
function collapseBlankRuns(lines) {
  const out = []
  for (const line of lines) {
    if (!line.trim() && out.length && !out[out.length - 1].trim()) continue
    out.push(line)
  }
  return out
}

function trimBlankEdges(lines) {
  let a = 0
  let b = lines.length
  while (a < b && !lines[a].trim()) a++
  while (b > a && !lines[b - 1].trim()) b--
  return lines.slice(a, b)
}

/** A labelled blockquote: `> **Label:** first line`, then the rest quoted. */
function quoteBlock(label, body) {
  const lines = collapseBlankRuns(trimBlankEdges(body))
  if (lines.length === 0) return [`> **${label}:**`]
  if (isPlainLine(lines[0])) return [`> **${label}:** ${lines[0]}`, ...lines.slice(1).map(quoteLine)]
  return [`> **${label}:**`, '>', ...lines.map(quoteLine)]
}

function calloutLines(node, ctx) {
  const type = String(node.attrs.type ?? 'info').toLowerCase()
  return quoteBlock(CALLOUT_KIND[type] ?? 'Note', linesOf(node.children, ctx))
}

function cardItem(node, ctx) {
  const title = typeof node.attrs.title === 'string' ? node.attrs.title : ''
  const description =
    typeof node.attrs.description === 'string' ? node.attrs.description : linesOf(node.children, ctx).join(' ').trim()
  const raw = typeof node.attrs.href === 'string' ? node.attrs.href : ''
  const href = raw.startsWith('/') && ctx.siteUrl ? `${ctx.siteUrl}${raw}` : raw
  const head = href ? `[${title}](${href})` : `**${title}**`
  return description ? `- ${head}: ${description}` : `- ${head}`
}

/** Child nodes that carry content: whitespace between sibling elements does not. */
function contentNodes(nodes) {
  return nodes.filter(node => !(node.kind === 'text' && !node.s.trim()))
}

function listOf(node, ctx) {
  const out = []
  for (const child of contentNodes(node.children)) {
    if (child.kind === 'el' && child.name === 'Card') out.push(cardItem(child, ctx))
    else out.push(...linesOf([child], ctx))
  }
  return out
}

function tabsLines(node, ctx) {
  const labels = stringList(node.attrs.items)
  const out = []
  let index = 0
  for (const child of contentNodes(node.children)) {
    if (child.kind === 'el' && child.name === 'Tab') {
      const label = typeof child.attrs.value === 'string' ? child.attrs.value : labels[index] ?? `Tab ${index + 1}`
      index++
      out.push(`**${label}**`, '', ...linesOf(child.children, ctx), '')
    } else {
      out.push(...linesOf([child], ctx))
    }
  }
  return out
}

function detailsLines(node, ctx) {
  const summary = node.children.find(child => child.kind === 'el' && child.name === 'summary')
  const title = summary ? linesOf(summary.children, ctx).join(' ').trim() : ''
  const rest = node.children.filter(child => child !== summary)
  return [title ? `### ${title}` : '', '', ...linesOf(rest, ctx)]
}

function routeContentLines(node, ctx) {
  const value = String(node.attrs.value ?? '')
  const label = ctx.routeLabels[value] ?? value
  return [`**${label}**`, '', ...linesOf(node.children, ctx), '']
}

function fileTreeLines(node) {
  const lines = []
  const walk = (children, depth) => {
    for (const child of children) {
      if (child.kind !== 'el') continue
      const pad = '  '.repeat(depth)
      if (child.name === 'FileTree.Folder') {
        lines.push(`${pad}${child.attrs.name}/`)
        walk(child.children, depth + 1)
      } else if (child.name === 'FileTree.File') {
        lines.push(`${pad}${child.attrs.name}`)
      }
    }
  }
  walk(node.children, 0)
  return ['```text', ...lines, '```']
}

const RENDERERS = {
  Steps: (node, ctx) => linesOf(node.children, ctx),
  Faq: (node, ctx) => linesOf(node.children, ctx),
  Cards: listOf,
  CardGroup: listOf,
  Card: (node, ctx) => [cardItem(node, ctx)],
  Callout: calloutLines,
  Tabs: tabsLines,
  Tab: (node, ctx) => linesOf(node.children, ctx),
  Details: detailsLines,
  RouteSwitch: (node, ctx) => linesOf(node.children, ctx),
  RouteSwitchContent: routeContentLines,
  RouteSwitchTrigger: () => [],
  FileTree: fileTreeLines,
}

/** Labels for RouteSwitch values, zipped from the first RouteSwitch and its trigger. */
function collectRouteLabels(text) {
  const values = text.match(/<RouteSwitch\s+values=\{(\[[^\]]*\])\}/)
  const labels = text.match(/<RouteSwitchTrigger\s+values=\{(\[[^\]]*\])\}/)
  const map = {}
  if (!values || !labels) return map
  const keys = stringList(values[1])
  const names = stringList(labels[1])
  keys.forEach((key, i) => {
    if (names[i]) map[key] = names[i]
  })
  return map
}

function collectImports(text) {
  const map = {}
  for (const m of text.matchAll(IMPORT_LINE)) map[m[1]] = m[2]
  return map
}

/** Directive containers (`:::note` … `:::`), fence-aware and nested, as blockquotes. */
function directiveEnd(lines, from) {
  let depth = 0
  let mark = null
  for (let j = from; j < lines.length; j++) {
    const line = lines[j]
    if (mark) {
      if (fenceCloses(line, mark, true)) mark = null
      continue
    }
    const open = fenceOpenMark(line, true)
    if (open) {
      mark = open
      continue
    }
    if (DIRECTIVE_OPEN.test(line)) depth++
    else if (DIRECTIVE_END.test(line)) {
      if (depth === 0) return j
      depth--
    }
  }
  return -1
}

function directiveLines(lines) {
  const out = []
  let mark = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (mark) {
      out.push(line)
      if (fenceCloses(line, mark, true)) mark = null
      continue
    }
    const open = fenceOpenMark(line, true)
    if (open) {
      mark = open
      out.push(line)
      continue
    }
    const m = DIRECTIVE_OPEN.exec(line)
    const end = m ? directiveEnd(lines, i + 1) : -1
    if (!m || end === -1) {
      out.push(line)
      continue
    }
    const label = m[2]?.trim() || DIRECTIVE_KIND[m[1]]
    // Blank lines around the quote keep neighbouring blocks from merging into it.
    out.push('', ...quoteBlock(label, directiveLines(lines.slice(i + 1, end))), '')
    i = end
  }
  return out
}

/** `:::note|info|tip|warning|caution|danger` containers become `> **Note:**`-style blockquotes. */
export function applyDirectives(markdown) {
  return directiveLines(markdown.split('\n')).join('\n')
}

/** Collapses runs of blank lines to one, except inside fenced code. */
function collapseBlankLines(markdown) {
  const out = []
  let mark = null
  let blank = false
  for (const line of markdown.split('\n')) {
    if (mark) {
      out.push(line)
      if (fenceCloses(line, mark, true)) mark = null
      continue
    }
    const open = fenceOpenMark(line, true)
    if (open) {
      mark = open
      out.push(line)
      blank = false
      continue
    }
    if (line.trim() === '') {
      if (!blank) out.push('')
      blank = true
      continue
    }
    blank = false
    out.push(line)
  }
  return out.join('\n')
}

/** Smallest indents: each block element's own content, dedented before rendering. */
function prepare(text, file) {
  try {
    const cur = { s: stripModuleStatements(text), i: 0 }
    const { nodes } = parseLevel(cur, [], null)
    dedentTree(nodes)
    return nodes
  } catch (err) {
    throw new Error(`${file || 'mdx source'}: ${err.message}`)
  }
}

/**
 * Convert one MDX body (no frontmatter) to Markdown.
 *   file        absolute path of the MDX source; relative demo imports resolve from it
 *   root        the clone directory, handed to hooks as ctx.root
 *   readImport  (absPath) => demo source text or null; imported components with no
 *               readable source become unresolved markers
 *   components  adapter hooks: name => (props, children, ctx) => Markdown | null;
 *               ctx.inline is true for elements inside a sentence
 * Returns { markdown, unresolved: Map<name, count> }.
 */
export function convertMdx(source, { siteUrl = '', file = '', root = '', readImport = () => null, components = {} } = {}) {
  const text = source.replace(/\r\n?/g, '\n')
  const ctx = {
    siteUrl,
    file,
    root,
    readImport,
    components,
    imports: collectImports(text),
    routeLabels: collectRouteLabels(text),
  }
  const nodes = prepare(text, file)
  let md
  try {
    md = renderSeq(nodes, ctx)
  } catch (err) {
    throw new Error(`${file || 'mdx source'}: ${err.message}`)
  }
  md = collapseBlankLines(applyDirectives(md)).replace(/^\n+|\n+$/g, '')
  return { markdown: `${md}\n`, unresolved: countUnresolved(md) }
}
