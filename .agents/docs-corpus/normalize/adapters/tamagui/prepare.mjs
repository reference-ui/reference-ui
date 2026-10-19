/**
 * Pre-pass over each MDX body, run before the shared converter. The converter
 * reads a block element's attributes with a regex that cannot hold nested braces,
 * and its tag reader does not skip template strings, so a props table whose
 * data has an object with a brace, or a template string with an apostrophe,
 * would come out as raw JSX. This pass moves every `={...}` attribute expression
 * on a block start tag into a stash and leaves `={TAMAGUI_EXPR_n}`; hooks read the
 * source back with exprOf(). It also turns the JSX spacer {' '} and inline
 * <Code>/<Link> in prose into text, since the converter can only mark those.
 * Fenced code and backtick code spans are copied through untouched.
 */

const FENCE_OPEN = /^(\s*)(`{3,}|~{3,})(.*)$/
const FENCE_CLOSE = /^\s*(`{3,}|~{3,})\s*$/
const BLOCK_TAG = /^[ \t]*<[A-Z][\w.]*(?=[\s/>]|$)/gm

function fenceMarkOf(line) {
  const m = line.match(FENCE_OPEN)
  if (!m || (m[2][0] === '`' && m[3].includes('`'))) return null
  return m[2]
}

function closesFence(line, mark) {
  const m = line.match(FENCE_CLOSE)
  return Boolean(m && m[1][0] === mark[0] && m[1].length >= mark.length)
}

/** The index of the closing quote for the string opened at `i`, or -1. */
function skipQuoted(str, i) {
  const quote = str[i]
  for (let j = i + 1; j < str.length; j++) {
    if (str[j] === '\\') j++
    else if (str[j] === quote) return j
  }
  return -1
}

/** The index of the closing backtick for the template opened at `i`, or -1. */
function skipTemplate(str, i) {
  for (let j = i + 1; j < str.length; j++) {
    if (str[j] === '\\') j++
    else if (str[j] === '`') return j
  }
  return -1
}

/** The index of the `}` that closes the `{` at `open`, or -1. JS comments inside are skipped. */
function matchBrace(str, open) {
  let depth = 0
  for (let i = open; i < str.length; i++) {
    const ch = str[i]
    if (ch === '/' && str[i + 1] === '/') {
      const end = str.indexOf('\n', i)
      if (end === -1) return -1
      i = end
    } else if (ch === '/' && str[i + 1] === '*') {
      const end = str.indexOf('*/', i + 2)
      if (end === -1) return -1
      i = end + 1
    } else if (ch === '"' || ch === "'" || ch === '`') {
      i = ch === '`' ? skipTemplate(str, i) : skipQuoted(str, i)
      if (i === -1) return -1
    } else if (ch === '{') {
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/** The index just past the `>` that ends the start tag at `start`, or -1. */
function headerEnd(str, start) {
  for (let i = start; i < str.length; i++) {
    const ch = str[i]
    if (ch === '"' || ch === "'" || ch === '`') {
      i = ch === '`' ? skipTemplate(str, i) : skipQuoted(str, i)
      if (i === -1) return -1
    } else if (ch === '{') {
      i = matchBrace(str, i)
      if (i === -1) return -1
    } else if (ch === '>') {
      return i + 1
    }
  }
  return -1
}

/** A start tag with each `={...}` expression moved to the stash. */
function stashAttributes(header, stash) {
  let out = ''
  for (let i = 0; i < header.length; i++) {
    const ch = header[i]
    if (ch === '"' || ch === "'") {
      const j = skipQuoted(header, i)
      if (j === -1) throw new Error(`unterminated attribute string in ${header.slice(0, 40)}`)
      out += header.slice(i, j + 1)
      i = j
    } else if (ch === '=' && header[i + 1] === '{') {
      const j = matchBrace(header, i + 1)
      if (j === -1) throw new Error(`unterminated attribute expression in ${header.slice(0, 40)}`)
      const id = `TAMAGUI_EXPR_${stash.size}`
      stash.set(id, header.slice(i + 2, j))
      out += `={${id}}`
      i = j
    } else {
      out += ch
    }
  }
  return out
}

/** Applies `fn` to the text outside backtick code spans only. */
function outsideCode(text, fn) {
  return text.replace(/(`+)[\s\S]*?\1|[^`]+/g, all => (all.startsWith('`') ? all : fn(all)))
}

/** Prose: the JSX spacer and inline <Code>/<Link>, outside code spans. */
function proseText(text) {
  return outsideCode(text, chunk =>
    chunk
      .replace(/\{\s*(['"]) \1\s*\}/g, ' ')
      .replace(/<span\b[^>]*>|<\/span>/g, '')
      .replace(/^[ \t]*<br\s*\/?>[ \t]*$/gm, '')
      .replace(/<[A-Z][\w.]*(?:\s[^<>{}]*)?\/>/g, tag => '`' + tag + '`')
      .replace(/<(Code|code)>([^<]*)<\/\1>/g, (_, __, inner) => `\`${inner}\``)
      .replace(/<(Link|a)\s+href=(?:"([^"]*)"|'([^']*)')\s*>([^<]*)<\/\1>/g, (_, __, dq, sq, label) => `[${label}](${dq ?? sq})`)
  )
}

/** A prose run with its block start tags stashed and its prose text cleaned. */
function processProse(text, stash) {
  let out = ''
  let pos = 0
  BLOCK_TAG.lastIndex = 0
  let m
  while ((m = BLOCK_TAG.exec(text))) {
    const start = text.indexOf('<', m.index)
    const end = headerEnd(text, start)
    if (end === -1) break
    out += proseText(text.slice(pos, start)) + stashAttributes(text.slice(start, end), stash)
    pos = end
    BLOCK_TAG.lastIndex = end
  }
  return out + proseText(text.slice(pos))
}

/**
 * The body ready for the converter, and the stash of its attribute expressions
 * (placeholder -> source text). Fenced blocks are copied as they are.
 */
export function prepareBody(text) {
  const stash = new Map()
  let dropped = 0
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const out = []
  let prose = []
  const flush = () => {
    if (prose.length) out.push(processProse(prose.join('\n'), stash))
    prose = []
  }
  for (let i = 0; i < lines.length; i++) {
    const mark = fenceMarkOf(lines[i])
    if (mark === null) {
      prose.push(lines[i])
      continue
    }
    flush()
    const block = [lines[i]]
    let j = i + 1
    for (; j < lines.length; j++) {
      block.push(lines[j])
      if (closesFence(lines[j], mark)) break
    }
    // An empty `hero template=` block is a placeholder the site fills from the demo, which HeroContainer already inlines.
    const placeholder = /hero template=/.test(lines[i]) && block.slice(1, -1).every(line => line.trim() === '')
    if (!placeholder) out.push(block.join('\n'))
    else dropped++
    i = j
  }
  flush()
  return { text: out.join('\n'), stash, dropped }
}
