/**
 * Markdown structure for the corpus: fence-aware headings, GitHub-style
 * slugs (de-duplicated per page), and section entries. A page splits at its
 * H2 headings; an H2 section over `maxWords` splits again at its H3 headings.
 * The text before a split point stays under its own H2 entry.
 */

const FENCE = /^\s*(`{3,}|~{3,})/
const ATX = /^(#{1,6})\s+(.*?)\s*#*\s*$/
const LINK = /\[([^\]]*)\]\([^)]*\)/g

/**
 * A heading's text as the index reads it: a link keeps its label and drops
 * its target, so `[Light and Dark Mode](#light-and-dark-mode)` is "Light and
 * Dark Mode" (the target would otherwise index the words twice).
 */
export function plainHeading(text) {
  return String(text).replace(LINK, '$1').trim()
}

/** Headings outside fenced code: [{ index, level, text }], text plain. */
export function scanHeadings(lines) {
  const heads = []
  let fence = null
  lines.forEach((line, index) => {
    const f = line.match(FENCE)
    if (fence) {
      if (f && f[1][0] === fence[0] && f[1].length >= fence.length && line.trim() === f[1]) fence = null
      return
    }
    if (f) {
      fence = f[1]
      return
    }
    const h = line.match(ATX)
    if (h) heads.push({ index, level: h[1].length, text: plainHeading(h[2]) })
  })
  return heads
}

export function slugify(text) {
  const slug = String(text)
    .replace(/`[^`]*`/g, match => match.slice(1, -1))
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_~]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  return slug || 'section'
}

/** A slug not yet in `used`; records it. */
export function uniqueSlug(base, used) {
  let candidate = base
  for (let n = 2; used.has(candidate); n++) candidate = `${base}-${n}`
  used.add(candidate)
  return candidate
}

export function countWords(text) {
  return (text.match(/\S+/g) ?? []).length
}

function entry(level, heading, title, lines) {
  const markdown = lines.join('\n').replace(/\n+$/, '\n')
  return { level, heading, title, markdown, words: countWords(markdown) }
}

/** Heading index that ends a block starting at `start` for this level. */
function blockEnd(heads, start, level, total) {
  const next = heads.find(h => h.index > start && h.level <= level)
  return next ? next.index : total
}

/**
 * Section entries for one page body (no page H1). Each entry carries its
 * heading, a breadcrumb title (`Page › H2 › H3`), and its Markdown starting
 * at the heading line.
 */
export function splitSections(body, { pageTitle, maxWords = 400 }) {
  const lines = body.split('\n')
  const heads = scanHeadings(lines)
  const out = []
  for (const h2 of heads.filter(h => h.level === 2)) {
    const end = blockEnd(heads, h2.index, 2, lines.length)
    const section = lines.slice(h2.index, end)
    const subs = heads.filter(h => h.level === 3 && h.index > h2.index && h.index < end)
    if (countWords(section.join('\n')) <= maxWords || subs.length === 0) {
      out.push(entry(2, h2.text, `${pageTitle} › ${h2.text}`, section))
      continue
    }
    const pre = lines.slice(h2.index, subs[0].index)
    if (pre.slice(1).some(line => line.trim() !== '')) {
      out.push(entry(2, h2.text, `${pageTitle} › ${h2.text}`, pre))
    }
    subs.forEach((h3, k) => {
      const stop = k + 1 < subs.length ? subs[k + 1].index : end
      out.push(
        entry(3, h3.text, `${pageTitle} › ${h2.text} › ${h3.text}`, lines.slice(h3.index, stop))
      )
    })
  }
  return out
}

/** All H2 and deeper heading texts, for page-level concept matching. */
export function headingTexts(body) {
  return scanHeadings(body.split('\n'))
    .filter(h => h.level >= 2)
    .map(h => h.text)
}
