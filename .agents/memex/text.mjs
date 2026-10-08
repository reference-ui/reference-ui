/**
 * Memex text utilities: tokenizing, stemming, frontmatter, snippets.
 *
 * The tokenizer splits on non-alphanumerics so hyphen compounds, code
 * spans, and paths index as useful parts; the Porter stemmer folds
 * inflections on both sides. Frontmatter parsing is permissive by
 * design: every flat `key: value` is kept, nothing is required, and a
 * doc without frontmatter is just a body.
 */

const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---\n?/
const FIELD_PATTERN = /^([A-Za-z][\w-]*):\s*(.*)$/
const TITLE_PATTERN = /^#\s+(.+)$/m
const SNIPPET_MAX_LENGTH = 220
const MIN_SNIPPET_LINE_LENGTH = 2

/** Split on anything that is not a letter or digit. */
export function tokenize(text) {
  return String(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
}

function porterConsonant(s, i) {
  if (i < 0 || i >= s.length) return false
  const ch = s[i]
  if (ch === 'y') return i === 0 || !porterConsonant(s, i - 1)
  return !'aeiou'.includes(ch)
}

function porterMeasure(s) {
  let n = 0
  for (let i = 1; i < s.length; i++) {
    if (porterConsonant(s, i) && !porterConsonant(s, i - 1)) n++
  }
  return n
}

function porterCvc(s) {
  const e = s.length
  return (
    e >= 3 &&
    porterConsonant(s, e - 1) &&
    !porterConsonant(s, e - 2) &&
    porterConsonant(s, e - 3) &&
    !'wxy'.includes(s[e - 1])
  )
}

function porterHasVowel(s) {
  for (let i = 0; i < s.length; i++) if (!porterConsonant(s, i)) return true
  return false
}

const PORTER_STEP2 = [
  ['ational', 'ate'],
  ['tional', 'tion'],
  ['enci', 'ence'],
  ['anci', 'ance'],
  ['izer', 'ize'],
  ['bli', 'ble'],
  ['alli', 'al'],
  ['entli', 'ent'],
  ['eli', 'e'],
  ['ousli', 'ous'],
  ['ization', 'ize'],
  ['ation', 'ate'],
  ['ator', 'ate'],
  ['alism', 'al'],
  ['iveness', 'ive'],
  ['fulness', 'ful'],
  ['ousness', 'ous'],
  ['aliti', 'al'],
  ['iviti', 'ive'],
  ['biliti', 'ble'],
  ['logi', 'log'],
]
const PORTER_STEP3 = [
  ['icate', 'ic'],
  ['ative', ''],
  ['alize', 'al'],
  ['iciti', 'ic'],
  ['ical', 'ic'],
  ['ful', ''],
  ['ness', ''],
]
const PORTER_STEP4 = [
  'al',
  'ance',
  'ence',
  'er',
  'ic',
  'able',
  'ible',
  'ant',
  'ement',
  'ment',
  'ent',
  'ion',
  'ou',
  'ism',
  'ate',
  'iti',
  'ous',
  'ive',
  'ize',
]

function porterStem(w) {
  if (w.endsWith('sses')) w = w.slice(0, -2)
  else if (w.endsWith('ies')) w = w.slice(0, -2)
  else if (!w.endsWith('ss') && w.endsWith('s')) w = w.slice(0, -1)
  let step1b = false
  if (w.endsWith('eed')) {
    if (porterMeasure(w.slice(0, -3)) > 0) w = w.slice(0, -1)
  } else if (w.endsWith('ed') && porterHasVowel(w.slice(0, -2))) {
    w = w.slice(0, -2)
    step1b = true
  } else if (w.endsWith('ing') && porterHasVowel(w.slice(0, -3))) {
    w = w.slice(0, -3)
    step1b = true
  }
  if (step1b) {
    if (w.endsWith('at') || w.endsWith('bl') || w.endsWith('iz')) w += 'e'
    else if (
      w.length >= 2 &&
      w[w.length - 1] === w[w.length - 2] &&
      porterConsonant(w, w.length - 1) &&
      !'lsz'.includes(w[w.length - 1])
    ) {
      w = w.slice(0, -1)
    } else if (porterMeasure(w) === 1 && porterCvc(w)) w += 'e'
  }
  if (w.endsWith('y') && porterHasVowel(w.slice(0, -1))) w = w.slice(0, -1) + 'i'
  for (const [suf, repl] of PORTER_STEP2) {
    if (w.endsWith(suf) && porterMeasure(w.slice(0, -suf.length)) > 0) {
      w = w.slice(0, -suf.length) + repl
      break
    }
  }
  for (const [suf, repl] of PORTER_STEP3) {
    if (w.endsWith(suf) && porterMeasure(w.slice(0, -suf.length)) > 0) {
      w = w.slice(0, -suf.length) + repl
      break
    }
  }
  for (const suf of PORTER_STEP4) {
    if (!w.endsWith(suf)) continue
    const stem = w.slice(0, -suf.length)
    if (porterMeasure(stem) <= 1) break
    if (suf === 'ion' && !'st'.includes(stem[stem.length - 1])) break
    w = stem
    break
  }
  if (w.endsWith('e')) {
    const stem = w.slice(0, -1)
    const m = porterMeasure(stem)
    if (m > 1 || (m === 1 && !porterCvc(stem))) w = stem
  }
  if (w.endsWith('ll') && porterMeasure(w) > 1) w = w.slice(0, -1)
  return w
}

export function stem(term) {
  if (!/^[a-z]{3,}$/.test(term)) return term
  return porterStem(term)
}

export function processTerm(term) {
  const lower = term.toLowerCase()
  if (lower.length < 2) return undefined
  return stem(lower)
}

function unquote(value) {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1)
  }
  return value
}

/** Split `---` frontmatter from body; every flat field is kept. */
export function parseFrontmatter(raw) {
  const match = raw.match(FRONTMATTER_PATTERN)
  if (!match) return { fields: {}, body: raw }
  const fields = {}
  for (const line of match[1].split('\n')) {
    const field = line.match(FIELD_PATTERN)
    if (field) fields[field[1]] = unquote(field[2].trim())
  }
  return { fields, body: raw.slice(match[0].length) }
}

/** Normalize a tags value (`[a, b]` or `a, b`) to an array. */
export function parseTags(value) {
  if (value === undefined || value === null) return []
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean)
  return String(value)
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map(v => v.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean)
}

export function extractTitle(body) {
  return body.match(TITLE_PATTERN)?.[1].trim() ?? null
}

/** Edit distance with early exit past the cap. */
export function levenshtein(a, b, cap = 2) {
  if (Math.abs(a.length - b.length) > cap) return cap + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let rowMin = i
    const row = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost)
      rowMin = Math.min(rowMin, row[j])
    }
    if (rowMin > cap) return cap + 1
    prev = row
  }
  return prev[b.length]
}

function cap(text) {
  if (text.length <= SNIPPET_MAX_LENGTH) return text
  return text.slice(0, SNIPPET_MAX_LENGTH - 1).trimEnd() + '…'
}

function isHeading(line) {
  return line.startsWith('#')
}

function closestWord(line, needles) {
  let best = null
  for (const word of line.toLowerCase().split(/[^a-z0-9]+/)) {
    if (word.length < 4) continue
    for (const needle of needles) {
      if (needle.length < 4 || line.toLowerCase().includes(needle)) continue
      if (levenshtein(word, needle) <= 2) {
        if (!best || word.length < best.length) best = word
      }
    }
  }
  return best
}

/** Query terms as snippet needles: tokenized, junk tokens dropped. */
export function snippetNeedles(terms) {
  return terms
    .flatMap(term =>
      String(term)
        .toLowerCase()
        .split(/[^a-z0-9]+/)
    )
    .filter(n => n.length >= 3)
}

function coverage(line, needles) {
  const lower = line.toLowerCase()
  return needles.filter(needle => lower.includes(needle)).length
}

/**
 * Best snippet line plus the fuzzy variants it matched, if any.
 * Needles tokenize like the query; the winning line covers the most
 * needles; the fallback skips headings; lines in `exclude` lose (dup
 * re-pick across hits). Never silent-truncates.
 */
export function snippet(body, terms, exclude = new Set()) {
  const lines = String(body)
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length >= MIN_SNIPPET_LINE_LENGTH)
  const needles = snippetNeedles(terms)
  const fresh = lines.filter(line => !exclude.has(line))
  const literal = line => coverage(line, needles) > 0
  let hit = null
  let best = 0
  for (const line of fresh) {
    const score = coverage(line, needles)
    if (score > best) {
      best = score
      hit = line
    }
  }
  if (hit) return { text: cap(hit), fuzzy: [] }
  if (!lines.some(literal)) {
    for (const line of fresh) {
      const variant = closestWord(line, needles)
      if (variant) return { text: cap(line), fuzzy: [variant] }
    }
  }
  const fallback = fresh.find(line => !isHeading(line)) ?? fresh[0] ?? lines[0] ?? ''
  return { text: cap(fallback), fuzzy: [] }
}

/** First prose paragraph after leading headings, one line, capped. */
export function firstParagraph(markdown, maxLen = 180) {
  const para = []
  let started = false
  for (const line of String(markdown).split('\n')) {
    const t = line.trim()
    if (!started) {
      if (!t || t.startsWith('#')) continue
      started = true
    }
    if (!t) break
    if (t.startsWith('#') || t.startsWith('|') || t.startsWith('```')) break
    para.push(t)
  }
  let s = para.join(' ').replace(/\s+/g, ' ').trim()
  if (s.length > maxLen) s = s.slice(0, maxLen - 1).trimEnd() + '…'
  return s
}
