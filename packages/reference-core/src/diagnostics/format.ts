// Neo warning presentation: the one-line summary plus the verbose list.
// It takes diagnostics and emits the yellow count line by default or the
// location-plus-code-plus-hint rows under --verbose. Every channel rides
// this shape behind its tag; the strings are pinned by the CLI tests.
import { warningHintFor } from '@reference-ui/rust/diagnostics'
import type { DeduplicatedDiagnostic, NeoDiagnostic } from './types.ts'

// U+26A0 WARNING SIGN with no variation selector: terminals render the
// text glyph in the applied yellow, never the color-emoji presentation.
const WARN_GLYPH = '⚠'
const MULT_SIGN = '×'
const COMPILER_TAG = '[compiler]'
const REF_TAG = '[ref]'

const RESET = '\x1b[0m'
const YELLOW = '\x1b[33m'

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

// The default warning report: at most ONE line per sync — the yellow sign,
// the count, and the bracketed --verbose pointer. The caller stays silent
// when the count is zero, so this shape only ever renders for N >= 1.
export function formatWarningSummary(count: number): string {
  const total = Math.max(0, Math.floor(count))
  const noun = total === 1 ? 'warning' : 'warnings'
  return `${paint(WARN_GLYPH, YELLOW)} ${total} ${noun} [--verbose]`
}

function diagnosticKey(entry: NeoDiagnostic): string {
  return [
    entry.severity,
    entry.code ?? '',
    entry.message,
    entry.file ?? '',
    entry.line ?? '',
    entry.column ?? '',
    entry.span === undefined ? '' : `${entry.span.start}:${entry.span.end}`,
    entry.labels === undefined ? '' : JSON.stringify(entry.labels),
    entry.help === undefined ? '' : JSON.stringify(entry.help),
  ].join('\0')
}

// Collapse exact repeats into counted groups in first-seen order. Same
// code, message, and location folds to one item with a ×N count; anything
// else stays its own line, so no warning ever prints twice.
export function dedupeDiagnostics(entries: readonly NeoDiagnostic[]): DeduplicatedDiagnostic[] {
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

function verboseLocation(entry: NeoDiagnostic): string {
  if (!entry.file) return ''
  if (entry.line === undefined) return entry.file
  if (entry.column === undefined) return `${entry.file}:${entry.line}`
  return `${entry.file}:${entry.line}:${entry.column}`
}

// The verbose tail, exactly one, never both: engine help first (joined
// with '; ' so suggestion pairs stay on the one row), else the static
// hint for the code, else no tail. Blank help lines never print — the
// transport already rejects them, so a blank here reads as absent and the
// static hint still wins over rendering nothing.
function verboseTail(entry: NeoDiagnostic): string {
  const help = entry.help?.filter(line => line.trim().length > 0) ?? []
  if (help.length > 0) return ` — ${help.join('; ')}`
  const hint = warningHintFor(entry.code)
  if (hint !== undefined) return ` — ${hint}`
  return ''
}

// One verbose item: location plus message plus the tail where known.
// The compiler and ref backchannels ride the same shape behind their tags,
// so every channel stays distinguishable on the shared stderr. Legacy
// codeless items print without a code segment, and locationless items
// degrade to tag plus message, never a guessed location. Coded lines keep
// their code on every channel; the tag never replaces it.
export function formatVerboseWarningLine(item: DeduplicatedDiagnostic, channel?: 'compiler' | 'ref'): string {
  const head: string[] = []
  if (channel === 'compiler') head.push(COMPILER_TAG)
  if (channel === 'ref') head.push(REF_TAG)
  const location = verboseLocation(item.entry)
  if (location !== '') head.push(location)
  const prefix = head.length > 0 ? `${head.join(' ')} ` : ''
  const code = item.entry.code === undefined ? '' : `${paint(item.entry.code, YELLOW)}: `
  const repeats = item.count > 1 ? ` ${MULT_SIGN}${item.count}` : ''
  const tail = verboseTail(item.entry)
  return `  ${prefix}${code}${item.entry.message}${repeats}${tail}`
}
