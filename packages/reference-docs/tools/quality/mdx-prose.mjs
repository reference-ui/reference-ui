// Prose check for the docs gate. It takes an MDX source and its body's first line, and emits the
// lines that carry an em dash (U+2014) in prose. Fenced code, inline code, the frontmatter and a
// table cell that is only the dash placeholder are exempt: the placeholder marks an empty value,
// the same way the Panda reference tables in the corpus use it.

const EM_DASH = '—'
const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/
const FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/
const INLINE_CODE = /(`+)(?:(?!\1)[\s\S])*?\1/g
const PLACEHOLDER_CELL = /\|[ \t]*—[ \t]*(?=\|)/g

/** Lines (1-based) with an em dash in their prose. */
export function emDashLines(source, bodyLine) {
  const hits = []
  let fence = null
  source.split(/\r?\n/).forEach((text, index) => {
    const line = index + 1
    if (line < bodyLine) return
    if (fence) {
      if (closesFence(text, fence)) fence = null
      return
    }
    const open = FENCE_OPEN.exec(text)
    if (open) {
      fence = open[1]
      return
    }
    const prose = text.replace(INLINE_CODE, ' ').replace(PLACEHOLDER_CELL, '|')
    if (prose.includes(EM_DASH)) hits.push(line)
  })
  return hits
}

function closesFence(text, fence) {
  const close = FENCE_CLOSE.exec(text)
  return close !== null && close[1][0] === fence[0] && close[1].length >= fence.length
}
