/**
 * Typegen vocabulary intake for the primitives generator, over the landed W0 napi.
 * Fetches PropDefs names via primitivesVocabulary() and cross-checks the named
 * conditions against the generated canon Rust table to catch a stale native binary.
 * Fails closed on unsorted props, breakpoint keys in the system-independent set, and
 * aliases resolving outside the prop set. Pins the reserved keys and the caption/menu
 * element overrides the React surface inherits from the splitter.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { primitivesVocabulary } from '../../typegen/js/index.js'

export interface VocabView {
  stylePropNames: string[]
  conditions: string[]
  aliases: Record<string, string>
  dialect: string[]
}

export const RESERVED_KEYS = [
  'className',
  'children',
  'colorMode',
  'variant',
  'css',
  'ref',
]

export const ELEMENT_OVERRIDES: Record<string, string> = {
  caption: 'HTMLTableCaptionElement',
  menu: 'HTMLMenuElement',
}

const here = dirname(fileURLToPath(import.meta.url))
const CONDITIONS_RS_PATH = resolve(here, '../../canon/src/conditions.rs')

function fail(source: string, detail: string): never {
  throw new Error(`[primitives] ${source}: ${detail}`)
}

function isSorted(values: readonly string[]): boolean {
  for (let index = 1; index < values.length; index += 1) {
    if (values[index - 1] > values[index]) return false
  }
  return true
}

function parseNamedConditions(conditionsRs: string): string[] {
  const lines = conditionsRs.split('\n')
  const start = lines.findIndex(line => line.includes('pub const NAMED_CONDITIONS'))
  if (start < 0) fail('conditions.rs', 'missing NAMED_CONDITIONS block')
  const end = lines.findIndex((line, index) => index > start && line.trim() === '];')
  if (end < 0) fail('conditions.rs', 'unterminated NAMED_CONDITIONS block')
  const names: string[] = []
  for (const line of lines.slice(start + 1, end)) {
    const match = /^\s*"([^"]+)",$/.exec(line)
    if (!match) fail('conditions.rs', `unparseable condition line: ${line.trim()}`)
    names.push(match[1])
  }
  return names
}

function verifyConditions(conditions: string[]): string[] {
  const leaked = conditions.filter(key => key.startsWith('@'))
  if (leaked.length > 0)
    fail(
      'vocabulary',
      `breakpoint keys in the system-independent set: ${leaked.join(',')}`
    )
  if (!isSorted(conditions)) fail('vocabulary', 'conditions arrive unsorted from napi')
  const table = parseNamedConditions(readFileSync(CONDITIONS_RS_PATH, 'utf8'))
  if (JSON.stringify(conditions) !== JSON.stringify(table)) {
    fail(
      'vocabulary',
      'napi conditions drift from canon NAMED_CONDITIONS (stale native binary?)'
    )
  }
  return [...conditions]
}

function verifyAliases(
  aliases: Record<string, string>,
  props: ReadonlySet<string>
): Record<string, string> {
  const sorted: Record<string, string> = {}
  for (const key of Object.keys(aliases).sort()) {
    if (!props.has(key)) fail('vocabulary', `alias <${key}> is not a style prop`)
    if (!props.has(aliases[key]))
      fail('vocabulary', `alias <${key}> targets unknown <${aliases[key]}>`)
    sorted[key] = aliases[key]
  }
  return sorted
}

function verifyDialect(dialect: readonly string[]): string[] {
  for (const member of ['colorMode', 'variant']) {
    if (!dialect.includes(member)) fail('vocabulary', `dialect lost reserved <${member}>`)
  }
  return [...dialect].sort()
}

export function loadVocabulary(): VocabView {
  const vocab = primitivesVocabulary()
  if (vocab.props.length === 0) fail('vocabulary', 'napi returned an empty prop set')
  if (!isSorted(vocab.props)) fail('vocabulary', 'props arrive unsorted from napi')
  const props = new Set(vocab.props)
  return {
    stylePropNames: [...vocab.props],
    conditions: verifyConditions(vocab.conditions),
    aliases: verifyAliases(vocab.aliases, props),
    dialect: verifyDialect(vocab.dialect),
  }
}
