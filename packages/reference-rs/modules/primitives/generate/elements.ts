/**
 * HTML element roster for the primitives vocabulary, joined from two canon sources.
 * The TS overlay partition (HTML vs SVG) selects the namespace while the generated Rust
 * ELEMENTS table supplies the JSX spellings. Only the 101 HTML-namespace tags survive
 * per HQ namespace law — SVG children never emit. Fails closed on overlay/Rust drift,
 * JSX collisions, map-rule violations, and uncovered family assignments.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PRIMITIVE_TAGS } from '../../canon/generate/overlay/primitives.js'

export type ElementFamily =
  | 'html-flow'
  | 'html-text'
  | 'html-form'
  | 'html-table'
  | 'html-media'
  | 'html-interactive'
  | 'special'

export interface ElementRow {
  dom: string
  jsx: string
  family: ElementFamily
}

export interface ElementSources {
  overlayTags: readonly string[]
  overlayText: string
  htmlRs: string
}

const here = dirname(fileURLToPath(import.meta.url))
const OVERLAY_PATH = resolve(here, '../../canon/generate/overlay/primitives.ts')
const HTML_RS_PATH = resolve(here, '../../canon/src/html.rs')
const SVG_MARKER = 'Curated SVG host child elements styled by authors'
const HTML_COUNT = 101
const SVG_COUNT = 24
const ELEMENTS_COUNT = 125

const FAMILY_MEMBERS: Record<ElementFamily, readonly string[]> = {
  'html-flow': [
    'address',
    'article',
    'aside',
    'blockquote',
    'dd',
    'div',
    'dl',
    'dt',
    'figcaption',
    'figure',
    'footer',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'header',
    'hgroup',
    'li',
    'main',
    'nav',
    'ol',
    'pre',
    'search',
    'section',
    'ul',
  ],
  'html-text': [
    'abbr',
    'bdi',
    'bdo',
    'cite',
    'code',
    'data',
    'del',
    'dfn',
    'em',
    'ins',
    'kbd',
    'mark',
    'rp',
    'rt',
    'ruby',
    'samp',
    'small',
    'span',
    'strong',
    'sub',
    'sup',
    'time',
  ],
  'html-form': [
    'button',
    'datalist',
    'fieldset',
    'input',
    'label',
    'legend',
    'meter',
    'optgroup',
    'option',
    'output',
    'progress',
    'select',
    'textarea',
  ],
  'html-table': ['col', 'colgroup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr'],
  'html-media': [
    'audio',
    'canvas',
    'embed',
    'iframe',
    'img',
    'picture',
    'source',
    'svg',
    'track',
    'video',
  ],
  'html-interactive': ['area', 'details', 'dialog', 'form', 'summary'],
  special: [
    'a',
    'b',
    'br',
    'caption',
    'hr',
    'i',
    'map',
    'menu',
    'object',
    'p',
    'q',
    's',
    'u',
    'var',
    'wbr',
  ],
}

function fail(source: string, detail: string): never {
  throw new Error(`[primitives] ${source}: ${detail}`)
}

function isSorted(values: readonly string[]): boolean {
  for (let index = 1; index < values.length; index += 1) {
    if (values[index - 1] > values[index]) return false
  }
  return true
}

export function loadElementSources(): ElementSources {
  return {
    overlayTags: PRIMITIVE_TAGS,
    overlayText: readFileSync(OVERLAY_PATH, 'utf8'),
    htmlRs: readFileSync(HTML_RS_PATH, 'utf8'),
  }
}

function quotedStrings(line: string): string[] {
  const names: string[] = []
  for (const match of line.matchAll(/'([^']+)'/g)) names.push(match[1])
  return names
}

function parseOverlayPartition(overlayText: string): { html: string[]; svg: string[] } {
  const lines = overlayText.split('\n')
  const markerLines = lines.filter(line => line.includes(SVG_MARKER))
  if (markerLines.length !== 1)
    fail('overlay', `expected one SVG marker line, found ${markerLines.length}`)
  const markerIndex = lines.findIndex(line => line.includes(SVG_MARKER))
  const html: string[] = []
  const svg: string[] = []
  lines.forEach((line, index) => {
    const target = index < markerIndex ? html : svg
    target.push(...quotedStrings(line))
  })
  return { html, svg }
}

function extractRustBlock(htmlRs: string, startMarker: string): string[] {
  const lines = htmlRs.split('\n')
  const start = lines.findIndex(line => line.includes(startMarker))
  if (start < 0) fail('html.rs', `missing block ${startMarker}`)
  const end = lines.findIndex((line, index) => index > start && line.trim() === '];')
  if (end < 0) fail('html.rs', `unterminated block ${startMarker}`)
  return lines.slice(start + 1, end)
}

function parseElementsTable(htmlRs: string): Array<[string, string]> {
  const rows: Array<[string, string]> = []
  for (const line of extractRustBlock(htmlRs, 'pub const ELEMENTS')) {
    const match = /^\s*Element::new\("([^"]+)", "([^"]+)"\),$/.exec(line)
    if (!match) fail('html.rs', `unparseable ELEMENTS line: ${line.trim()}`)
    rows.push([match[1], match[2]])
  }
  return rows
}

function parsePrimitiveJsx(htmlRs: string): string[] {
  const names: string[] = []
  for (const line of extractRustBlock(htmlRs, 'pub const PRIMITIVE_JSX')) {
    const match = /^\s*"([^"]+)",$/.exec(line)
    if (!match) fail('html.rs', `unparseable PRIMITIVE_JSX line: ${line.trim()}`)
    names.push(match[1])
  }
  return names
}

function verifyRustTables(htmlRs: string): Map<string, string> {
  const elements = parseElementsTable(htmlRs)
  if (elements.length !== ELEMENTS_COUNT) {
    fail('html.rs', `ELEMENTS has ${elements.length} entries, expected ${ELEMENTS_COUNT}`)
  }
  const htmlColumn = elements.map(([html]) => html)
  if (!isSorted(htmlColumn)) fail('html.rs', 'ELEMENTS html column is not sorted')
  const primitiveJsx = parsePrimitiveJsx(htmlRs)
  if (primitiveJsx.length !== ELEMENTS_COUNT) {
    fail(
      'html.rs',
      `PRIMITIVE_JSX has ${primitiveJsx.length} entries, expected ${ELEMENTS_COUNT}`
    )
  }
  if (!isSorted(primitiveJsx)) fail('html.rs', 'PRIMITIVE_JSX is not sorted')
  const jsxFromElements = [...new Set(elements.map(([, jsx]) => jsx))].sort()
  if (JSON.stringify(jsxFromElements) !== JSON.stringify(primitiveJsx)) {
    fail('html.rs', 'ELEMENTS jsx column drifts from PRIMITIVE_JSX')
  }
  return new Map(elements)
}

function verifyPartition(
  html: string[],
  svg: string[],
  overlayTags: readonly string[]
): void {
  if (html.length !== HTML_COUNT)
    fail('overlay', `HTML partition has ${html.length} tags, expected ${HTML_COUNT}`)
  if (svg.length !== SVG_COUNT)
    fail('overlay', `SVG partition has ${svg.length} tags, expected ${SVG_COUNT}`)
  if (JSON.stringify([...html, ...svg]) !== JSON.stringify([...overlayTags])) {
    fail('overlay', 'partitioned tags drift from the imported PRIMITIVE_TAGS array')
  }
}

function familyOf(tag: string, families: Map<string, ElementFamily>): ElementFamily {
  const family = families.get(tag)
  if (!family) fail('families', `no family assigned to <${tag}>`)
  return family
}

function buildFamilyMap(): Map<string, ElementFamily> {
  const families = new Map<string, ElementFamily>()
  for (const [family, members] of Object.entries(FAMILY_MEMBERS) as Array<
    [ElementFamily, readonly string[]]
  >) {
    for (const tag of members) {
      if (families.has(tag)) fail('families', `<${tag}> assigned twice`)
      families.set(tag, family)
    }
  }
  if (families.size !== HTML_COUNT)
    fail('families', `family table covers ${families.size} tags, expected ${HTML_COUNT}`)
  return families
}

export function joinElements(sources: ElementSources): ElementRow[] {
  const { html, svg } = parseOverlayPartition(sources.overlayText)
  verifyPartition(html, svg, sources.overlayTags)
  const elements = verifyRustTables(sources.htmlRs)
  const svgLower = svg.map(tag => tag.toLowerCase())
  for (const tag of svgLower) {
    if (!elements.has(tag)) fail('join', `SVG child <${tag}> missing from ELEMENTS`)
  }
  const allowed = new Set([...html, ...svgLower])
  for (const tag of elements.keys()) {
    if (!allowed.has(tag))
      fail('join', `ELEMENTS carries <${tag}> outside both partitions`)
  }
  const rows: ElementRow[] = []
  const seenJsx = new Set<string>()
  for (const tag of html) {
    if (tag !== tag.toLowerCase())
      fail('join', `<${tag}> needs a React spelling column (F1 lives)`)
    const jsx = elements.get(tag)
    if (!jsx) fail('join', `HTML tag <${tag}> missing from ELEMENTS`)
    if (seenJsx.has(jsx)) fail('join', `JSX collision on ${jsx}`)
    seenJsx.add(jsx)
    rows.push({ dom: tag, jsx, family: 'special' })
  }
  for (const forbidden of ['Box', 'Flex', 'Grid']) {
    if (seenJsx.has(forbidden))
      fail('join', `map-rule violation: ${forbidden} in the roster`)
  }
  const families = buildFamilyMap()
  for (const row of rows) row.family = familyOf(row.dom, families)
  rows.sort((left, right) => (left.jsx < right.jsx ? -1 : left.jsx > right.jsx ? 1 : 0))
  return rows
}
