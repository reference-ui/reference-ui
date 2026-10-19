/**
 * The converter reads a JSX tag's attributes with a shallow pattern, so an
 * element whose data nests braces deeper than that is read wrong. The
 * adapter therefore lifts each block-level data element out of the page text
 * before conversion: the element's own source is kept here, and a
 * `<MantineElement id="n" />` stands in its place. The `MantineElement` hook
 * reads the kept source with a depth-aware reader and runs the component's hook
 * with those props. Fenced code and inline JSX are left alone.
 */

const store = new Map()
let next = 1

/** Attributes of one opening tag's source, read with depth-aware braces and quotes. */
export function readAttributes(raw) {
  const props = {}
  let i = raw.indexOf('<') + 1
  while (i < raw.length && /[\w.]/.test(raw[i])) i++
  for (;;) {
    while (i < raw.length && /\s/.test(raw[i])) i++
    if (raw.startsWith('/>', i) || raw[i] === '>' || i >= raw.length) break
    const name = raw.slice(i).match(/^[A-Za-z_][\w:-]*/)
    if (!name) throw new Error(`cannot read attribute at ${i}`)
    i += name[0].length
    if (raw[i] !== '=') {
      props[name[0]] = true
      continue
    }
    i++
    if (raw[i] === '"' || raw[i] === "'") {
      const end = raw.indexOf(raw[i], i + 1)
      props[name[0]] = raw.slice(i + 1, end)
      i = end + 1
    } else if (raw[i] === '{') {
      const end = closeOf(raw, i)
      props[name[0]] = raw.slice(i + 1, end).trim()
      i = end + 1
    } else {
      throw new Error(`attribute ${name[0]} has no value`)
    }
  }
  return props
}

/** Index of the `}` that closes the `{` at `open`, skipping strings and nested brackets. */
function closeOf(text, open) {
  let depth = 0
  for (let i = open; i < text.length; i++) {
    const c = text[i]
    if (c === '"' || c === "'" || c === '`') {
      for (i++; i < text.length && text[i] !== c; i++) if (text[i] === '\\') i++
    } else if (c === '{' || c === '[' || c === '(') depth++
    else if (c === '}' || c === ']' || c === ')') {
      depth--
      if (depth === 0) return i
    }
  }
  throw new Error('unclosed attribute expression')
}

/**
 * Index of the line that closes a self-closing `<Name ... />` starting on
 * `lines[start]` at column `col`, or -1 when the element is not self-closing or
 * has text after its `/>`.
 */
function selfClosingEnd(lines, start, col) {
  let depth = 0
  let quote = null
  for (let l = start; l < lines.length; l++) {
    const line = lines[l]
    for (let c = l === start ? col : 0; c < line.length; c++) {
      const ch = line[c]
      if (quote) {
        if (ch === '\\') c++
        else if (ch === quote) quote = null
        continue
      }
      if (ch === '"' || ch === "'" || ch === '`') quote = ch
      else if (ch === '{' || ch === '[' || ch === '(') depth++
      else if (ch === '}' || ch === ']' || ch === ')') depth--
      else if (depth === 0 && ch === '/' && line[c + 1] === '>') {
        return line.slice(c + 2).trim() === '' ? l : -1
      } else if (depth === 0 && ch === '>') return -1
    }
    if (quote === '"' || quote === "'") quote = null
  }
  return -1
}

/**
 * Replaces each block-level self-closing element named in `names` (outside
 * fenced code, and only when it starts its line) with a `<MantineElement id />`
 * placeholder, keeping its source for the hook.
 */
export function liftBlockElements(text, names) {
  const lines = text.split('\n')
  const out = []
  let fence = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const f = line.match(/^\s*(`{3,}|~{3,})/)
    if (fence) {
      if (f && f[1][0] === fence[0] && f[1].length >= fence.length && line.trim() === f[1]) fence = null
      out.push(line)
      continue
    }
    if (f) {
      fence = f[1]
      out.push(line)
      continue
    }
    const open = line.match(/^(\s*)<([A-Z][\w.]*)(?=[\s/>]|$)/)
    const end = open && names.has(open[2]) ? selfClosingEnd(lines, i, open[1].length) : -1
    if (end === -1) {
      out.push(line)
      continue
    }
    const id = String(next++)
    store.set(id, { name: open[2], raw: lines.slice(i, end + 1).join('\n') })
    out.push(`${open[1]}<MantineElement id="${id}" />`)
    i = end
  }
  return out.join('\n')
}

/** The lifted element for a placeholder id: { name, props }. */
export function liftedElement(id) {
  const entry = store.get(String(id))
  if (!entry) throw new Error(`no lifted element ${id}`)
  return { name: entry.name, props: readAttributes(entry.raw) }
}
