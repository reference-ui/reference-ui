/**
 * Prose-only rewrites for park-ui MDX, run before the shared converter. Fenced
 * code is never touched. Multi-line MDX comments are removed, because the site
 * never renders them. `:::info` boxes become Callout elements, which the shared
 * converter draws as blockquotes. The one raw HTML image link becomes Markdown,
 * and the line break tag becomes a paragraph break.
 */

const FENCE_OPEN = /^(\s*)(`{3,}|~{3,})(.*)$/
const FENCE_CLOSE = /^\s*(`{3,}|~{3,})\s*$/

/** Applies `fn` to each run of prose lines. Fenced blocks pass through unchanged. */
function mapProse(source, fn) {
  const out = []
  let run = []
  let fence = null
  const flush = () => {
    if (run.length) out.push(fn(run.join('\n')))
    run = []
  }
  for (const line of source.split('\n')) {
    if (fence) {
      out.push(line)
      const close = line.match(FENCE_CLOSE)
      if (close && close[1][0] === fence.char && close[1].length >= fence.length) fence = null
      continue
    }
    const open = line.match(FENCE_OPEN)
    if (open && !(open[2][0] === '`' && open[3].includes('`'))) {
      flush()
      fence = { char: open[2][0], length: open[2].length }
      out.push(line)
      continue
    }
    run.push(line)
  }
  flush()
  return out.join('\n')
}

/** MDX comments, which may span lines. The site never renders them. */
const dropComments = text => text.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')

/** `:::info` ... `:::` boxes become Callout elements. */
const callouts = text =>
  text.replace(/^:::([A-Za-z]+)[ \t]*$/gm, '<Callout type="$1">').replace(/^:::[ \t]*$/gm, '</Callout>')

/** `<a href><img src alt /></a>` written as raw HTML becomes a Markdown linked image. */
const anchorImages = text =>
  text.replace(/<a\s+href="([^"]+)"[^>]*>\s*<img\b([^>]*?)\/?>\s*<\/a>/g, (whole, href, attrs) => {
    const src = attrs.match(/\bsrc="([^"]+)"/)?.[1]
    if (!src) return whole
    const alt = attrs.match(/\balt="([^"]*)"/)?.[1] ?? ''
    return `[![${alt}](${src})](${href})`
  })

/** A line break tag inside a paragraph becomes a paragraph break. */
const lineBreaks = text => text.replace(/[ \t]*<br\s*\/?>[ \t]*/g, '\n\n')

/** A page body (frontmatter already removed) with its prose-only rewrites applied. */
export function prepareBody(body) {
  return mapProse(body, prose => lineBreaks(anchorImages(callouts(dropComments(prose)))))
}
