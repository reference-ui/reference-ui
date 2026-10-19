/**
 * Deterministic concept tagging. A concept applies when one of its keywords
 * appears in the heading text (title, description, headings), or when the
 * keywords appear in the prose at least as often as max(BODY_MIN, words/300).
 * Fenced code is not prose: a keyword that only shows up in code examples
 * says little about the page. Word keywords match whole words; keywords with
 * punctuation or spaces match as substrings.
 */

export const BODY_MIN = 3
const WORDS_PER_HIT = 300

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function hits(haystack, keyword) {
  const k = keyword.toLowerCase()
  if (/^[a-z0-9]+$/.test(k)) {
    const re = new RegExp(`(?<![a-z0-9])${escapeRegExp(k)}(?![a-z0-9])`, 'g')
    return (haystack.match(re) ?? []).length
  }
  return haystack.split(k).length - 1
}

/** Markdown with fenced code blocks removed. */
export function proseOnly(markdown) {
  const out = []
  let fence = null
  for (const line of markdown.split('\n')) {
    const f = line.match(/^\s*(`{3,}|~{3,})/)
    if (fence) {
      if (f && f[1][0] === fence[0] && f[1].length >= fence.length && line.trim() === f[1]) fence = null
      continue
    }
    if (f) {
      fence = f[1]
      continue
    }
    out.push(line)
  }
  return out.join('\n')
}

/** Concepts for one text unit, in vocabulary order. */
export function tagConcepts({ head = '', body = '' }, vocabulary) {
  const headText = head.toLowerCase()
  const prose = proseOnly(body).toLowerCase()
  const words = (prose.match(/\S+/g) ?? []).length
  const threshold = Math.max(BODY_MIN, Math.ceil(words / WORDS_PER_HIT))
  const tags = []
  for (const [concept, keywords] of Object.entries(vocabulary)) {
    const inHead = keywords.some(k => hits(headText, k) > 0)
    const bodyCount = keywords.reduce((sum, k) => sum + hits(prose, k), 0)
    if (inHead || bodyCount >= threshold) tags.push(concept)
  }
  return tags
}
