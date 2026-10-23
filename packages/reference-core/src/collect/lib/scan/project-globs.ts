// Glob model for the project walk's visit rule. Each include list's brace-expanded alternatives become segment automata that
// picomatch decides one segment at a time. A walk state is the sorted set of unfinished positions after the names read so far:
// two directories with one canonical path and one state have the same future, so the walk visits each such pair once.
// compileGlobs returns undefined for any list outside the subset this model reads exactly; the walk keeps its wave-2 cut there.
// Segment matchers read `[!b]` through negatedClassesAsCaret (glob-classes.ts), so a negated class means what it means in Rust.

import picomatch from 'picomatch'
import { negatedClassesAsCaret } from './glob-classes.ts'

/** The lists a walk decides with: keep over the root-relative path (`kr`) or the absolute path (`ka`), ignore over the root-relative path (`ir`) or the scope-local path (`il`). */
export type GlobTag = 'kr' | 'ka' | 'ir' | 'il'

/** One list: its tag and its patterns, normalized and with any leading negation already removed. */
export interface GlobListInput {
  tag: GlobTag
  patterns: readonly string[]
}

/** Where a walk's paths start: the scope's path from the root, and the scope base's absolute path. */
export interface FormPrefixes {
  rel: string
  alias: string
}

/** One path segment of an alternative: the globstar `**`, or a test on one name. */
interface Segment {
  globstar: boolean
  matches: (name: string) => boolean
}

/** One position of the walk's state: the segment an alternative reads next, under the text that names the position. */
interface Node {
  /** `tag:alternative:index`: the list, the alternative, and how many of its segments are consumed. */
  text: string
  /** The node's place among all texts, so a state sorts by one integer. */
  rank: number
  /** The segment read next, or undefined once every segment is consumed. */
  segment: Segment | undefined
}

/** Every list a walk decides with, compiled: each list's tag with the ids of its alternatives' first positions, and every position. */
export interface CompiledGlobs {
  lists: { tag: GlobTag; starts: number[] }[]
  nodes: Node[]
  /** The node id of each position text. */
  ids: Map<string, number>
}

/**
 * Expands `{a,b}` alternations as atomic's braces.rs does: the same alternatives in the same order, with commaless braces
 * kept literal and unmatched braces left as they are.
 */
export function expandBraces(pattern: string): string[] {
  const chars = Array.from(pattern)
  const pair = findBracePair(chars)
  if (pair === undefined) return [pattern]
  const [open, close] = pair
  const choices = splitChoices(chars.slice(open + 1, close))
  if (choices.length < 2) return expandLiteralBraces(chars, close)
  const before = chars.slice(0, open).join('')
  const after = chars.slice(close + 1).join('')
  return choices.flatMap((choice) => expandBraces(before + choice + after))
}

// Keeps a commaless brace pair literal while expanding the text after it.
function expandLiteralBraces(chars: readonly string[], close: number): string[] {
  const head = chars.slice(0, close + 1).join('')
  const tail = chars.slice(close + 1).join('')
  return expandBraces(tail).map((rest) => head + rest)
}

// The first `{` with its depth-zero mate; a `{` without a mate leaves the whole pattern unexpanded, as the Rust port does.
export function findBracePair(chars: readonly string[]): [number, number] | undefined {
  const open = findUnescaped(chars, 0, '{')
  if (open === undefined) return undefined
  const close = findMate(chars, open)
  return close === undefined ? undefined : [open, close]
}

function findUnescaped(chars: readonly string[], from: number, want: string): number | undefined {
  let at = from
  while (at < chars.length) {
    if (chars[at] === '\\') {
      at += 2
      continue
    }
    if (chars[at] === want) return at
    at += 1
  }
  return undefined
}

function findMate(chars: readonly string[], open: number): number | undefined {
  let depth = 0
  let at = open
  while (at < chars.length) {
    if (chars[at] === '\\') {
      at += 2
      continue
    }
    depth = trackBrace(chars[at] ?? '', depth)
    if (depth === 0) return at
    at += 1
  }
  return undefined
}

function trackBrace(hit: string, depth: number): number {
  if (hit === '{') return depth + 1
  if (hit === '}') return depth - 1
  return depth
}

// Splits the innards of a brace on its top-level commas: a part that closes its own braces ends a choice.
export function splitChoices(chars: readonly string[]): string[] {
  const choices: string[] = []
  let current = ''
  let depth = 0
  for (const part of splitUnescapedCommas(chars)) {
    if (current !== '') current += ','
    current += part
    depth += braceDelta(part)
    if (depth === 0) {
      choices.push(current)
      current = ''
    }
  }
  if (current !== '') choices.push(current)
  return choices
}

// Splits on every unescaped comma, keeping the escapes intact for the later passes.
function splitUnescapedCommas(chars: readonly string[]): string[] {
  const parts: string[] = []
  let current = ''
  let at = 0
  while (at < chars.length) {
    if (chars[at] === '\\' && at + 1 < chars.length) {
      current += (chars[at] ?? '') + (chars[at + 1] ?? '')
      at += 2
      continue
    }
    if (chars[at] === ',') {
      parts.push(current)
      current = ''
    } else {
      current += chars[at] ?? ''
    }
    at += 1
  }
  parts.push(current)
  return parts
}

// The net unescaped `{` minus `}` depth of one comma-separated part: a backslash escapes the character after it.
function braceDelta(part: string): number {
  let delta = 0
  let escaped = false
  for (const hit of part) {
    if (!escaped) delta += braceStep(hit)
    escaped = !escaped && hit === '\\'
  }
  return delta
}

function braceStep(hit: string): number {
  if (hit === '{') return 1
  if (hit === '}') return -1
  return 0
}

/** True when a pattern body uses only the syntax the walk model reads like picomatch: no parens, pipes, backslashes or POSIX classes. */
export function hasWalkableChars(body: string): boolean {
  return (
    !body.includes('(') &&
    !body.includes(')') &&
    !body.includes('|') &&
    !body.includes('\\') &&
    !body.includes('[:')
  )
}

// Globstars agree only as whole segments (`**/`, `/**/`); adjacent or tripled
// stars cross directories natively while picomatch reads them as plain stars.
export function hasWalkStarSegments(body: string): boolean {
  if (body.includes('***')) return false
  return body.split('/').every((segment) => !segment.includes('**') || segment === '**')
}

// Characters that make a segment a picomatch pattern; any other segment is a plain name, compared as it is.
const SEGMENT_SYNTAX = /[*?[\]{}()!+@]/

/**
 * Compiles one alternative's segment. picomatch reads a leading `!` as a negation, but a path segment's `!` is a literal in
 * the whole pattern, so the model escapes it.
 */
function compileSegment(segment: string): Segment {
  if (segment === '**') return { globstar: true, matches: () => false }
  if (!SEGMENT_SYNTAX.test(segment)) return { globstar: false, matches: (name) => name === segment }
  const text = segment.startsWith('!') ? `\\${segment}` : segment
  return { globstar: false, matches: picomatch(negatedClassesAsCaret(text), { dot: true }) }
}

// An alternative is modeled when the two whole-pattern checks pass and every segment is whole: a bracket or brace that a
// slash splits would be one class or literal to picomatch, and two segments to the model.
export function modeledAlternative(alternative: string): boolean {
  return hasWalkableChars(alternative) && hasWalkStarSegments(alternative) && alternative.split('/').every(wholeSegment)
}

// A segment is whole when every brace it opens it closes, and every bracket class it opens closes after its first member.
function wholeSegment(segment: string): boolean {
  let depth = 0
  for (const char of segment) {
    if (char === '{') depth += 1
    else if (char === '}' && depth > 0) depth -= 1
  }
  return depth === 0 && bracketsClose(segment)
}

function bracketsClose(segment: string): boolean {
  let at = 0
  while (at < segment.length) {
    if (segment[at] !== '[') {
      at += 1
      continue
    }
    let next = at + 1
    if (segment[next] === '!' || segment[next] === '^') next += 1
    if (segment[next] === ']') next += 1
    const close = segment.indexOf(']', next)
    if (close === -1) return false
    at = close + 1
  }
  return true
}

/**
 * Compiles the lists of one walk. Returns undefined when a list is negated or any alternative is outside the modeled subset,
 * so the walk keeps its wave-2 cut for that scope.
 */
export function compileGlobs(lists: readonly GlobListInput[]): CompiledGlobs | undefined {
  const nodes: Node[] = []
  const compiled: CompiledGlobs['lists'] = []
  for (const list of lists) {
    const alternatives = compileAlternatives(list.patterns)
    if (alternatives === undefined) return undefined
    const starts = alternatives.map((segments, alternative) => appendNodes(nodes, list.tag, alternative, segments))
    compiled.push({ tag: list.tag, starts })
  }
  return rankNodes(compiled, nodes)
}

// The alternatives of one list's patterns, or undefined when a pattern is negated or one of its alternatives is not modeled.
function compileAlternatives(patterns: readonly string[]): Segment[][] | undefined {
  const alternatives: Segment[][] = []
  for (const pattern of patterns) {
    if (pattern.startsWith('!')) return undefined
    for (const alternative of expandBraces(pattern)) {
      if (!modeledAlternative(alternative)) return undefined
      alternatives.push(alternative.split('/').map(compileSegment))
    }
  }
  return alternatives
}

// Appends one alternative's positions, from index 0 through its length, as consecutive nodes; returns the id of index 0.
function appendNodes(nodes: Node[], tag: GlobTag, alternative: number, segments: readonly Segment[]): number {
  const start = nodes.length
  for (let index = 0; index <= segments.length; index++) {
    nodes.push({ text: `${tag}:${alternative}:${index}`, rank: 0, segment: segments[index] })
  }
  return start
}

// Ranks every node by its text, so a state sorts into the order of its texts; the id map finds a text's node.
function rankNodes(lists: CompiledGlobs['lists'], nodes: Node[]): CompiledGlobs {
  const order = nodes.map((_, id) => id).sort((a, b) => compareTexts(nodes[a], nodes[b]))
  order.forEach((id, rank) => {
    nodes[id].rank = rank
  })
  return { lists, nodes, ids: new Map(nodes.map((node, id) => [node.text, id])) }
}

function compareTexts(a: Node, b: Node): number {
  if (a.text === b.text) return 0
  return a.text < b.text ? -1 : 1
}

// The ids of a set closed over globstars: a globstar also reaches the position after it, which matches zero segments.
function closeIds(globs: CompiledGlobs, ids: Iterable<number>): Set<number> {
  const closed = new Set<number>()
  const pending = [...ids]
  while (pending.length > 0) {
    const id = pending.pop() ?? -1
    if (closed.has(id)) continue
    closed.add(id)
    if (globs.nodes[id]?.segment?.globstar) pending.push(id + 1)
  }
  return closed
}

// The ids reached by reading one name: a globstar absorbs it, a matching segment advances, and every other position dies.
function stepIds(globs: CompiledGlobs, ids: Iterable<number>, name: string): Set<number> {
  const reached: number[] = []
  for (const id of ids) {
    const segment = globs.nodes[id]?.segment
    if (segment === undefined) continue
    if (segment.globstar) reached.push(id)
    else if (segment.matches(name)) reached.push(id + 1)
  }
  return closeIds(globs, reached)
}

// The texts of a set of ids, in the sorted order of the texts.
function textsOf(globs: CompiledGlobs, ids: Iterable<number>): string[] {
  return [...ids].sort((a, b) => globs.nodes[a].rank - globs.nodes[b].rank).map((id) => globs.nodes[id].text)
}

// The ids of the positions named by a set of texts; a text that names no position of these lists is skipped.
function idsOf(globs: CompiledGlobs, positions: readonly string[]): number[] {
  const ids: number[] = []
  for (const position of positions) {
    const id = globs.ids.get(position)
    if (id !== undefined) ids.push(id)
  }
  return ids
}

/**
 * The positions every list starts in at a walk's start path: the list's prefix segments are read first. Keep and ignore lists
 * over the root-relative path start from `prefixes.rel`, absolute lists from `prefixes.alias`, and local lists at the base.
 */
export function startPositions(globs: CompiledGlobs, prefixes: FormPrefixes): string[] {
  const ids: number[] = []
  for (const list of globs.lists) {
    let current = closeIds(globs, list.starts)
    for (const name of prefixNames(list.tag, prefixes)) current = stepIds(globs, current, name)
    ids.push(...current)
  }
  return textsOf(globs, ids)
}

// The segments a list reads before the walk's own names: the root-relative or absolute start of its form, none for a local list.
function prefixNames(tag: GlobTag, prefixes: FormPrefixes): string[] {
  if (tag === 'ka') return ['', ...prefixes.alias.split('/').filter((name) => name !== '')]
  if (tag === 'il') return []
  return prefixes.rel === '' ? [] : prefixes.rel.split('/')
}

/** The positions after one name is read: each list's state moves on that name, and its closure is taken. Finished positions are kept. */
export function stepPositions(globs: CompiledGlobs, positions: readonly string[], name: string): string[] {
  return textsOf(globs, stepIds(globs, idsOf(globs, positions), name))
}

/**
 * The positions still able to read another name. A finished position (every segment consumed) has no successor, so a walk
 * keeps only these in its state and in its visit key.
 */
export function unfinishedPositions(globs: CompiledGlobs, positions: readonly string[]): string[] {
  return positions.filter((position) => {
    const id = globs.ids.get(position)
    return id !== undefined && globs.nodes[id]?.segment !== undefined
  })
}
