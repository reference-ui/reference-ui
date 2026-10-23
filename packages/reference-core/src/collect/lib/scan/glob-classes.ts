// Bracket-class reading for every picomatch the scan, include check and watch matcher build. picomatch
// reads `[!b]` as the members `!` and `b`, while the Rust walk and fast-glob read it as a negated class. negatedClassesAsCaret
// takes a glob and emits the same glob with each class-opening `[!` written as `[^`, each unclosed `[` escaped and each
// backslash inside a class doubled, so all of them agree with Rust.

/**
 * Rewrites each `[!` that opens a class to `[^`, which picomatch reads as a negated class while it reads `[!b]` as `!` or `b`.
 * The class is read as the Rust parse_class reads it: a backslash outside a class escapes the next character, a `]` right
 * after the opener is a member, a backslash inside a class is a member (written `\\` for picomatch), and a `[` with no
 * closing `]` is a literal (written `\[`). A leading `!` negation is never touched.
 */
export function negatedClassesAsCaret(glob: string): string {
  const chars = Array.from(glob)
  let out = ''
  let at = 0
  while (at < chars.length) {
    const [text, next] = readToken(chars, at)
    out += text
    at = next
  }
  return out
}

// The rewritten text of the token that starts at `at`, and the index past it.
function readToken(chars: readonly string[], at: number): [string, number] {
  const char = chars[at] ?? ''
  if (char === '\\') return [char + (chars[at + 1] ?? ''), at + 2]
  if (char !== '[') return [char, at + 1]
  const end = classEnd(chars, at)
  if (end === undefined) return ['\\[', at + 1]
  const body = chars
    .slice(at + 1, end)
    .join('')
    .replaceAll('\\', '\\\\')
  return [body.startsWith('!') ? `[^${body.slice(1)}` : `[${body}`, end]
}

// The index of the `]` that closes the class opened at `open`, or undefined when none does.
function classEnd(chars: readonly string[], open: number): number | undefined {
  let at = open + 1
  if (chars[at] === '!' || chars[at] === '^') at += 1
  if (chars[at] === ']') at += 1
  const close = chars.indexOf(']', at)
  return close === -1 ? undefined : close
}
