// Brace expansion for include patterns, matching atomic's braces.rs. It takes one pattern and emits its alternatives in order,
// with commaless braces kept literal and unmatched braces left as they are, plus the pair and choice finders the brace
// limits (brace-limits.ts) count with. Commaless pairs are stepped over by offset, so a pattern of thousands of pairs
// never recurses once per pair; only choice pairs recurse.

/**
 * Expands `{a,b}` alternations as atomic's braces.rs does: the same alternatives in the same order, with commaless braces
 * kept literal and unmatched braces left as they are. Commaless pairs are skipped in a loop, so only choice pairs recurse.
 */
export function expandBraces(pattern: string): string[] {
  const chars = Array.from(pattern)
  const found = findChoicePair(chars)
  if (found === undefined) return [pattern]
  const before = chars.slice(found.from, found.open).join('')
  const after = chars.slice(found.close + 1).join('')
  const expanded = found.choices.flatMap((choice) => expandBraces(before + choice + after))
  if (found.from === 0) return expanded
  const literal = chars.slice(0, found.from).join('')
  return expanded.map((rest) => literal + rest)
}

/** The first brace pair holding a choice: `from` is where the scan began after any literal commaless pairs, `open` and `close` bound the pair. */
export interface ChoicePair {
  from: number
  open: number
  close: number
  choices: string[]
}

/** The first choice pair at or after `from`, stepping over commaless pairs by offset; undefined when none is left. */
export function findChoicePair(chars: readonly string[], from = 0): ChoicePair | undefined {
  let at = from
  for (;;) {
    const pair = findBracePair(chars, at)
    if (pair === undefined) return undefined
    const [open, close] = pair
    const choices = splitChoices(chars.slice(open + 1, close))
    if (choices.length >= 2) return { from: at, open, close, choices }
    at = close + 1
  }
}

// The first `{` with its depth-zero mate; a `{` without a mate leaves the whole pattern unexpanded, as the Rust port does.
export function findBracePair(chars: readonly string[], from = 0): [number, number] | undefined {
  const open = findUnescaped(chars, from, '{')
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
