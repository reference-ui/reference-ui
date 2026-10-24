// The include shapes the walk models: every include that passes config validation is one of them.
// normalizeIncludePattern takes a pattern and rewrites its paren groups the way the Rust grammar reads them: `(a|b)` becomes
// `{a,b}` and a group with no `|` becomes the literal `[(]x[)]`. includeShapeProblem takes the normalized pattern and emits the
// message for the first shape picomatch and Rust read differently, or undefined. Validation runs both, so an include is either
// refused with the form to write or compiled by compileGlobs; the native addon, called directly, still reads parens literally.

import { expandBraces } from './braces.ts'
import { classEnd, hasPosixClass, splitClasses } from './glob-classes.ts'
import { wholeSegment } from './project-globs.ts'

// Characters that make a paren after them an extglob (`@(a)`, `!(a)`, `+(a)`, `*(a)`, `?(a)`), which the model does not read.
const EXTGLOB_LEAD = '@!+*?'

/**
 * Rewrites an include pattern's paren groups, keeping one leading `!`. A group with a top-level `|`, no nested paren, no `,`, `{`
 * or `}`, and no extglob character before it becomes `{a,b}`; the same group with no `|` becomes `[(]x[)]`, the literal Rust reads,
 * so a route-group folder such as `app/(marketing)/**` keeps working. Parens inside a bracket class are members and stay.
 */
export function normalizeIncludePattern(pattern: string): string {
  const negation = pattern.startsWith('!') ? '!' : ''
  const chars = Array.from(pattern.slice(negation.length))
  let out = ''
  let at = 0
  while (at < chars.length) {
    const [text, next] = readPiece(chars, at)
    out += text
    at = next
  }
  return negation + out
}

// The text of the piece that starts at `at`, and the index past it: a paren group, an escape pair, a whole class, or one character.
function readPiece(chars: readonly string[], at: number): [string, number] {
  return chars[at] === '(' ? readGroup(chars, at) : pieceOf(chars, at)
}

// A group that qualifies is rewritten whole; any other `(` stays and the shape check refuses it.
function readGroup(chars: readonly string[], open: number): [string, number] {
  const close = groupEnd(chars, open)
  const lead = open > 0 ? (chars[open - 1] ?? '') : ''
  if (close === undefined || (lead !== '' && EXTGLOB_LEAD.includes(lead))) return ['(', open + 1]
  const inner = chars.slice(open + 1, close)
  if (inner.some((char) => char === ',' || char === '{' || char === '}')) return ['(', open + 1]
  const alternatives = splitTopLevel(inner)
  const text = alternatives.length > 1 ? `{${alternatives.join(',')}}` : `[(]${inner.join('')}[)]`
  return [text, close + 1]
}

// The `)` that closes the group opened at `open`, or undefined when another `(` comes first or none closes it. Classes are skipped.
function groupEnd(chars: readonly string[], open: number): number | undefined {
  let at = open + 1
  while (at < chars.length) {
    const char = chars[at]
    if (char === ')') return at
    if (char === '(') return undefined
    if (char === '\\') at += 2
    else if (char === '[') at = (classEnd(chars, at) ?? at) + 1
    else at += 1
  }
  return undefined
}

// The group's alternatives, split on each `|` outside a class.
function splitTopLevel(inner: readonly string[]): string[] {
  const parts: string[] = []
  let current = ''
  let at = 0
  while (at < inner.length) {
    if (inner[at] === '|') {
      parts.push(current)
      current = ''
      at += 1
      continue
    }
    const [text, next] = pieceOf(inner, at)
    current += text
    at = next
  }
  parts.push(current)
  return parts
}

// An escape pair or a whole class as one piece, otherwise one character.
function pieceOf(chars: readonly string[], at: number): [string, number] {
  const char = chars[at] ?? ''
  if (char === '\\') return [char + (chars[at + 1] ?? ''), at + 2]
  const end = char === '[' ? classEnd(chars, at) : undefined
  return end === undefined ? [char, at + 1] : [chars.slice(at, end + 1).join(''), end + 1]
}

/**
 * The message for the first shape in a normalized include pattern that picomatch and the Rust grammar read differently, or
 * undefined when the pattern is one the walk models. `written` is the pattern as the config wrote it. The message names the
 * pattern and the form to write: `include pattern '<written>' <problem>; write <right form>`.
 */
export function includeShapeProblem(pattern: string, written: string = pattern): string | undefined {
  const body = pattern.startsWith('!') ? pattern.slice(1) : pattern
  const problem = bodyProblem(body) ?? alternativeProblem(body)
  return problem === undefined ? undefined : `include pattern '${written}' ${problem[0]}; write ${problem[1]}`
}

// [what is wrong, the form to write]
type Problem = [string, string]

// The problems of the whole body, before any brace is expanded.
function bodyProblem(body: string): Problem | undefined {
  if (body.startsWith('!')) return ['starts with two negation marks', 'one leading ! to negate the pattern']
  if (body.includes('\\')) {
    return ['uses a backslash', 'a character class for a literal character, such as [*] for a star']
  }
  const { outside, inside } = splitClasses(body)
  if (/[()|]/.test(outside)) {
    return [
      'uses parentheses or a pipe that sync cannot read',
      '{a,b} for alternatives and [(] and [)] for literal parentheses',
    ]
  }
  if (inside.some(hasPosixClass)) {
    return ['uses a POSIX class', 'a plain class such as [a-zA-Z] or [0-9]']
  }
  return undefined
}

// The problems of one brace alternative, in the order they are listed in the brief: stars, then a split bracket or brace.
function alternativeProblem(body: string): Problem | undefined {
  for (const alternative of expandBraces(body)) {
    if (alternative.includes('***')) return ['has a run of three or more stars', '** for any folders or * inside a name']
    const segments = alternative.split('/')
    if (segments.some((segment) => segment.includes('**') && segment !== '**')) {
      return ['has ** inside a folder name', '**/*x or x*/** with ** as a whole folder name']
    }
    if (!segments.every(wholeSegment)) {
      return ['has a bracket or brace that a / splits', 'every bracket and brace closed inside one folder name']
    }
  }
  return undefined
}
