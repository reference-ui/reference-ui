/**
 * Props tables read back from llms/llms-full.txt, the site's own text for every
 * docs page. There each PropTable tag is already rendered as a `### <part>`
 * heading and a `| Prop | Default | Type | Description |` table, in document
 * order. A tag the site could not render stays raw in that text, and is kept
 * as a null slot so the slots still line up with the page's tags.
 */

const PROPS_HEADER = '| Prop | Default | Type | Description |'
const RAW_PROP_TABLE = /^<PropTable\b.*\/>\s*$/

/**
 * One block per page, opened by an H1 whose text is a known page title. A block
 * ends where the next such H1 starts, which keeps stray fences in the text from
 * hiding page boundaries.
 */
export function llmsBlocks(lines, titles) {
  const starts = []
  lines.forEach((line, i) => {
    if (line.startsWith('# ') && titles.has(line.slice(2).trim())) starts.push(i)
  })
  return starts.map((start, k) => ({
    title: lines[start].slice(2).trim(),
    lines: lines.slice(start, k + 1 < starts.length ? starts[k + 1] : lines.length),
  }))
}

/** The H2 headings of a body, in order. Applied to both the page and its llms block. */
export function h2Sequence(lines) {
  return lines
    .filter(line => line.startsWith('## '))
    .map(line => line.slice(3).trim())
    .join('|')
}

/** The `### <part>` heading directly above a table, as its line and a blank, or none. */
function headingAbove(lines, i) {
  let k = i - 1
  while (k >= 0 && lines[k].trim() === '') k--
  return k >= 0 && lines[k].startsWith('### ') ? [lines[k], ''] : []
}

/**
 * The props slots of one block, in document order: `{ heading, table }` (the
 * `### <part>` line above the table, or null, and the table's rows), or null
 * for a tag the site left raw.
 */
export function propSlots(lines) {
  const slots = []
  for (let i = 0; i < lines.length; i++) {
    if (RAW_PROP_TABLE.test(lines[i])) {
      slots.push(null)
      continue
    }
    if (lines[i] !== PROPS_HEADER) continue
    const rows = []
    let j = i
    while (j < lines.length && lines[j].startsWith('|')) rows.push(lines[j++])
    const [heading] = headingAbove(lines, i)
    slots.push({ heading: heading ?? null, table: rows.join('\n') })
    i = j - 1
  }
  return slots
}
