/**
 * Pre-pass for Chakra's `:::` container directives and raw `<img>` tags. The
 * shared MDX converter reads JSX, not directives, so each directive becomes the
 * JSX element the converter already renders (`:::info` becomes
 * `<Callout type="info">`, `:::steps` becomes `<Steps>`). Fenced code is left
 * alone, and a directive still open at the end of the page is closed there, as
 * remark does. Fence rules match lib/mdx.mjs, so both agree on code blocks.
 */

const FENCE_OPEN = /^(\s*)(`{3,}|~{3,})(.*)$/
const FENCE_CLOSE = /^\s*(`{3,}|~{3,})\s*$/
const DIRECTIVE_OPEN = /^(:{3,})([A-Za-z][\w-]*)\s*$/
const DIRECTIVE_CLOSE = /^(:{3,})\s*$/
const IMG_START = /^\s*<img\b/
const BR_ONLY = /^\s*<br\s*\/?>\s*$/

/** Callout kinds the converter understands; `caution` maps to its `danger` kind. */
const CALLOUT_TYPE = { info: 'info', note: 'note', tip: 'tip', warning: 'warning', caution: 'danger', danger: 'danger' }
const PLAIN_TAG = { steps: 'Steps', 'card-group': 'CardGroup', 'code-group': 'CodeGroup' }

/** The opening JSX tag a directive becomes, and the tag its closer must end. */
function openingFor(name) {
  if (Object.hasOwn(CALLOUT_TYPE, name)) {
    return { tag: 'Callout', open: `<Callout type="${CALLOUT_TYPE[name]}">` }
  }
  if (Object.hasOwn(PLAIN_TAG, name)) return { tag: PLAIN_TAG[name], open: `<${PLAIN_TAG[name]}>` }
  // An unknown directive stays visible as an unresolved marker, never dropped.
  return { tag: 'Directive', open: `<Directive name="${name}">` }
}

/** An absolute URL for a root-relative path, or the path unchanged. */
function absolute(href, siteUrl) {
  return siteUrl && href.startsWith('/') ? `${siteUrl}${href}` : href
}

/** A raw `<img>` tag (possibly several lines) as a Markdown image; null when it has no src. */
function imageMarkdown(header, siteUrl) {
  const src = header.match(/\bsrc="([^"]*)"/)?.[1]
  if (!src) return null
  const alt = header.match(/\balt="([^"]*)"/)?.[1] ?? ''
  return `![${alt}](${absolute(src, siteUrl)})`
}

/** Consume one raw `<img>` starting at lines[i]; returns the replacement and the index of its last line. */
function readImage(lines, i, siteUrl) {
  let end = i
  while (end + 1 < lines.length && !/\/?>\s*$/.test(lines[end])) end++
  const header = lines.slice(i, end + 1).join('\n')
  const markdown = imageMarkdown(header, siteUrl)
  return markdown === null ? null : { markdown, end }
}

/**
 * The page body with `:::` directives and raw `<img>` tags rewritten to the
 * JSX the shared converter renders. Text inside every block is unchanged.
 */
export function prepareChakraMdx(text, { siteUrl = '' } = {}) {
  const lines = text.split('\n')
  const out = []
  const stack = []
  let fence = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (fence) {
      out.push(line)
      const close = line.match(FENCE_CLOSE)
      if (close && close[1][0] === fence[0] && close[1].length >= fence.length) fence = null
      continue
    }
    const open = line.match(FENCE_OPEN)
    if (open && !(open[2][0] === '`' && open[3].includes('`'))) {
      fence = open[2]
      out.push(line)
      continue
    }
    const dOpen = line.match(DIRECTIVE_OPEN)
    if (dOpen) {
      const { tag, open: jsx } = openingFor(dOpen[2])
      stack.push({ n: dOpen[1].length, tag })
      out.push(jsx)
      continue
    }
    const dClose = line.match(DIRECTIVE_CLOSE)
    if (dClose && stack.length && stack[stack.length - 1].n <= dClose[1].length) {
      out.push(`</${stack.pop().tag}>`)
      continue
    }
    if (IMG_START.test(line)) {
      const img = readImage(lines, i, siteUrl)
      if (img) {
        out.push(img.markdown)
        i = img.end
        continue
      }
    }
    // A line holding only <br /> is a spacer between blocks in the posts; it becomes a blank line.
    if (BR_ONLY.test(line)) {
      out.push('')
      continue
    }
    out.push(line)
  }
  while (stack.length) out.push(`</${stack.pop().tag}>`)
  return out.join('\n')
}

/** For each line, true when it is prose (outside fenced code), the same rule the converter uses. */
export function proseMask(text) {
  const mask = []
  let fence = null
  for (const line of text.split('\n')) {
    if (fence) {
      mask.push(false)
      const close = line.match(FENCE_CLOSE)
      if (close && close[1][0] === fence[0] && close[1].length >= fence.length) fence = null
      continue
    }
    const open = line.match(FENCE_OPEN)
    if (open && !(open[2][0] === '`' && open[3].includes('`'))) {
      fence = open[2]
      mask.push(false)
      continue
    }
    mask.push(true)
  }
  return mask
}
