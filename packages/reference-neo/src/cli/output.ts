// CLI printing helpers: they take exit-bound messages and emit the human
// lines. The usage block, the error-cause formatter, the one-line sync
// success shape, and the warning presentation (one-line summary plus the
// deduped verbose list with fix hints) live here so every command reports
// the same way. Colors follow the terminal (FORCE_COLOR forces, NO_COLOR
// kills); piped runs stay plain. Output strings are pinned by the bin
// tests and the CLI cases — change them only with the pins.
import { readdirSync, statSync } from 'node:fs'
import type { Dirent } from 'node:fs'
import { join } from 'node:path'
import type { NativeDiagnostic } from '../native/contract.ts'

export const USAGE = 'usage: ref <sync|clean> [dir]\n       ref sync --watch [dir]'

const GLYPH = '⎔'
const SEPARATOR = '⫶'
// U+26A0 WARNING SIGN with no variation selector: terminals render the
// text glyph in the applied yellow, never the color-emoji presentation.
const WARN_GLYPH = '⚠'
const MULT_SIGN = '×'
const COMPILER_TAG = '[compiler]'

const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const FAINT = '\x1b[2m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'

export function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export function printUsageError(detail: string): number {
  console.log(`${USAGE}\n${detail}`)
  return 1
}

// Colors stay on only for a live terminal: piped runs (specs, CI) print
// the plain shape, FORCE_COLOR forces color on, and NO_COLOR always wins.
function colorsEnabled(): boolean {
  const noColor = process.env.NO_COLOR
  if (noColor !== undefined && noColor !== '') return false
  const forced = process.env.FORCE_COLOR
  if (forced !== undefined && forced !== '' && forced !== '0') return true
  return process.stdout.isTTY === true
}

function paint(text: string, code: string): string {
  return colorsEnabled() ? `${code}${text}${RESET}` : text
}

function formatBytes(bytes: number): string {
  const size = Math.max(0, Math.floor(bytes))
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

// The §3.12 success line: glyph + command + stats, separators faint and
// never bright. Pure over its inputs, so the tests pin it verbatim.
export function formatSyncLine(elapsedMs: number, bytes: number): string {
  const glyph = paint(GLYPH, CYAN)
  const command = paint('ref sync', BOLD)
  const elapsed = paint(`${Math.max(0, Math.floor(elapsedMs))} ms`, GREEN)
  const size = paint(formatBytes(bytes), GREEN)
  const sep = paint(SEPARATOR, FAINT)
  return `${glyph} ${command} ${sep} ${elapsed} ${sep} ${size}`
}

function fileSizeBytes(path: string): number {
  try {
    return statSync(path).size
  } catch {
    return 0
  }
}

// Total bytes under the generated folder, or zero when it is missing or
// unreadable. Regular files only — links and sockets never count, so a
// self-referential link cannot loop the walk.
export function outDirSizeBytes(outDir: string): number {
  let entries: Dirent[]
  try {
    entries = readdirSync(outDir, { withFileTypes: true })
  } catch {
    return 0
  }
  let total = 0
  for (const entry of entries) {
    const full = join(outDir, entry.name)
    if (entry.isDirectory()) {
      total += outDirSizeBytes(full)
    } else if (entry.isFile()) {
      total += fileSizeBytes(full)
    }
  }
  return total
}

// The one-shot and watch-boot success report: measures the folder the
// sync just published and prints the §3.12 line. Errors stay with their
// commands — loud, full cause, unchanged.
export function printSyncLine(elapsedMs: number, outDir: string): void {
  console.log(formatSyncLine(elapsedMs, outDirSizeBytes(outDir)))
}

// One-line fix hints by stable warning code. Warnings only: infos are
// compiler telemetry with no author action, and errors throw unchanged.
// Codes missing here print without a hint — never a guessed one.
const WARNING_HINTS: Record<string, string> = {
  'ATM-W-DYNAMIC-EXPRESSION': 'hoist the expression into a static literal or variant',
  'ATM-W-DYNAMIC-MEMBER': 'replace the member lookup with a literal value',
  'ATM-W-DYNAMIC-IDENTIFIER': 'replace the identifier with a literal or token',
  'ATM-W-MUTATED-BINDING': 'stop reassigning the binding before the style call',
  'ATM-W-DYNAMIC-TEMPLATE': 'use a static string instead of the template',
  'ATM-W-DYNAMIC-UNARY': 'fold the unary expression to a literal',
  'ATM-W-DYNAMIC-BINARY': 'fold the binary expression to a literal',
  'ATM-W-UNFOLDABLE-KEY': 'use a static key instead of the computed key',
  'ATM-W-UNKNOWN-PROPERTY': 'remove it or check the property spelling',
  'ATM-W-UNKNOWN-BREAKPOINT': 'use a breakpoint from the theme',
  'ATM-W-NON-OBJECT-CONDITION': 'give the condition key a style object',
  'ATM-W-UNFOLDABLE-SPREAD': 'inline the spread or keep only static props',
  'ATM-W-UNKNOWN-CONDITION': 'use a condition from the theme',
  'ATM-W-MISSING-CONTAINER-ROOT': 'add a container root for the @container atom',
  'ATM-W-NON-CANONICAL-NUMERIC': 'use a plain decimal number',
  'ATM-W-INVALID-CSS-VALUE': 'use a CSS keyword, token, or value the prop accepts',
  'ATM-W-MALFORMED-OPACITY': 'write the opacity modifier as /<0-100>',
  'ATM-W-UNKNOWN-TOKEN-PATH': 'point the path at an existing token',
  'ATM-W-TOKEN-CATEGORY-MISMATCH': 'use a token from the matching category',
  'ATM-W-UNKNOWN-COLOR': 'use a color token or a CSS color',
  'ATM-W-UNTERMINATED-BRACE': 'close the { brace in the value',
  'ATM-W-STATIC-WILDCARD': 'use a concrete value; this prop has no token category',
  'ATM-W-EMPTY-AT-RULE': 'fill in the at-rule query or drop the key',
  'ATM-W-UNSUPPORTED-GLOBAL-VALUE': 'use a single value under the conditional key',
  'ATM-W-TRACE-SKIPPED': 'check the StyleTrace host graph for the skipped file',
  'ATM-W-NON-OBJECT-CSS-ARG': 'pass a static style object to css()',
  'ATM-W-NON-OBJECT-JSX-STYLE': 'pass a static style object to the style prop',
  'ATM-W-RESPONSIVE-ARRAY-SPREAD': 'remove the spread from the value array',
  'ATM-W-TAGGED-TEMPLATE-SITE': 'call css() with an object instead of a template',
  'ATM-W-UNFOLDABLE-OBJECT-PROP': 'give the const-object prop a static value',
  'ATM-W-PARTIAL-OBJECT-PROP': 'make the dynamic arm static or drop the prop',
  'ATM-W-TOKEN-CALL-REFUSED': 'use a supported token() shape',
  'ATM-W-MISSING-STYLE-PLAN': 'make the lookup static so the plan can serve it',
  'ATM-W-RESPONSIVE-LEAF-IMPORTANT': 'drop the ! marker; per-leaf important is refused',
  'ATM-W-UNREALIZABLE-EXTENSION': 'drop the prop; the dialect has no served css form',
}

function warningHintFor(code: string | undefined): string | undefined {
  if (code === undefined) return undefined
  return WARNING_HINTS[code]
}

// The default warning report: at most ONE line per sync — the yellow sign,
// the count, and the bracketed --verbose pointer. The caller stays silent
// when the count is zero, so this shape only ever renders for N >= 1.
export function formatWarningSummary(count: number): string {
  const total = Math.max(0, Math.floor(count))
  const noun = total === 1 ? 'warning' : 'warnings'
  return `${paint(WARN_GLYPH, YELLOW)} ${total} ${noun} [--verbose]`
}

export interface DeduplicatedDiagnostic {
  entry: NativeDiagnostic
  count: number
}

function diagnosticKey(entry: NativeDiagnostic): string {
  return [entry.severity, entry.code ?? '', entry.message, entry.file ?? '', entry.line ?? '', entry.column ?? ''].join(
    '\0'
  )
}

// Collapse exact repeats into counted groups in first-seen order. Same
// code, message, and location folds to one item with a ×N count; anything
// else stays its own line, so no warning ever prints twice.
export function dedupeDiagnostics(entries: readonly NativeDiagnostic[]): DeduplicatedDiagnostic[] {
  const groups = new Map<string, DeduplicatedDiagnostic>()
  for (const entry of entries) {
    const key = diagnosticKey(entry)
    const found = groups.get(key)
    if (found) {
      found.count += 1
    } else {
      groups.set(key, { entry, count: 1 })
    }
  }
  return [...groups.values()]
}

function verboseLocation(entry: NativeDiagnostic): string {
  if (!entry.file) return ''
  if (entry.line === undefined) return entry.file
  if (entry.column === undefined) return `${entry.file}:${entry.line}`
  return `${entry.file}:${entry.line}:${entry.column}`
}

// One verbose item: location plus message plus the fix hint where known.
// The compiler backchannel rides the same shape behind its tag, so the
// two channels stay distinguishable in a single deduped list.
export function formatVerboseWarningLine(item: DeduplicatedDiagnostic, compiler: boolean): string {
  const head: string[] = []
  if (compiler) head.push(COMPILER_TAG)
  const location = verboseLocation(item.entry)
  if (location !== '') head.push(location)
  const prefix = head.length > 0 ? `${head.join(' ')} ` : ''
  const code = item.entry.code === undefined ? '' : `${paint(item.entry.code, YELLOW)}: `
  const repeats = item.count > 1 ? ` ${MULT_SIGN}${item.count}` : ''
  const hint = warningHintFor(item.entry.code)
  const tail = hint === undefined ? '' : ` — ${hint}`
  return `  ${prefix}${code}${item.entry.message}${repeats}${tail}`
}
