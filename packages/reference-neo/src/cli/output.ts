// CLI printing helpers: they take exit-bound messages and emit the human
// lines. Boot prints the Vite-style block (brand, version, ready time,
// then CSS, warnings, and watch rows); watch resyncs print the §3.12
// one-liner, and both shapes share the warning-fold rule below. Warning
// presentation routes from the standalone diagnostics module and is
// re-exported so every command reports the same way. Colors follow the
// terminal (FORCE_COLOR forces, NO_COLOR kills); piped runs stay plain.
// Output strings are pinned by the bin tests and the CLI cases — change
// them only with the pins.
import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  dedupeDiagnostics,
  formatJsonDiagnostics,
  formatVerboseWarningLine,
  formatWarningSummary,
  reportedSyncEntries,
} from '../diagnostics/index.ts'
import type { DeduplicatedDiagnostic } from '../diagnostics/index.ts'

export { dedupeDiagnostics, formatJsonDiagnostics, formatVerboseWarningLine, formatWarningSummary, reportedSyncEntries }
export type { DeduplicatedDiagnostic }

export const USAGE = 'usage: ref <sync|clean> [dir]\n       ref sync --watch [dir]'

const GLYPH = '⎔'
const SEPARATOR = '⫶'
const ARROW = '→'
// The brand carries one trailing pad space: REF is three columns against
// Vite's four, so the pad lines our version — and ready-in — up with
// Vite's whenever the versions run the same length.
const BRAND = 'REF '

const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const FAINT = '\x1b[2m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
// Bright blue reads on dark terminals; plain blue (34) does not, so the
// brand never uses it.
const BLUE = '\x1b[94m'

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
// never bright, plus the folded warning segment when one rode along. Pure
// over its inputs, so the tests pin it verbatim.
export function formatSyncLine(elapsedMs: number, bytes: number, warnings = 0): string {
  const glyph = paint(GLYPH, CYAN)
  const command = paint('ref sync', BOLD)
  const elapsed = paint(`${Math.max(0, Math.floor(elapsedMs))} ms`, GREEN)
  const size = paint(formatBytes(bytes), GREEN)
  const sep = paint(SEPARATOR, FAINT)
  const folded = Math.max(0, Math.floor(warnings))
  if (folded === 0) return `${glyph} ${command} ${sep} ${elapsed} ${sep} ${size}`
  return `${glyph} ${command} ${sep} ${elapsed} ${sep} ${size} ${sep} ${formatWarningSummary(folded)}`
}

// The fold rule, stated once: verbose already lists every warning above,
// so a one-liner carries the count only by default. Callers pass the raw
// total with their mode; the line takes what this returns.
export function foldedWarningCount(total: number, verbose: boolean): number {
  if (verbose) return 0
  return Math.max(0, Math.floor(total))
}

function fileSizeBytes(path: string): number {
  try {
    return statSync(path).size
  } catch {
    return 0
  }
}

// The headline size every success shape reports: the published stylesheet
// bytes, or zero when the sheet is missing or unreadable. One number, one
// meaning — the block's CSS row and the resync one-liner never disagree.
export function cssSizeBytes(outDir: string): number {
  return fileSizeBytes(join(outDir, 'styled', 'styles.css'))
}

// One manifest read: the version when this dir is the Neo package itself,
// undefined for any other package.json, a torn file, or a miss.
function readManifestVersion(dir: string): string | undefined {
  try {
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { name?: unknown; version?: unknown }
    if (manifest.name !== '@reference-ui/neo' || typeof manifest.version !== 'string') return undefined
    return manifest.version
  } catch {
    return undefined
  }
}

let cachedVersion: string | undefined

// The CLI's own version for the boot header: climbs from this file to the
// Neo package.json, so src, dist, and bundled layouts all resolve. Cached
// after the first read; 0.0.0 when no manifest answers.
export function refVersion(): string {
  if (cachedVersion !== undefined) return cachedVersion
  let dir = dirname(fileURLToPath(import.meta.url))
  for (let depth = 0; depth < 6; depth += 1) {
    const found = readManifestVersion(dir)
    if (found !== undefined) {
      cachedVersion = found
      return found
    }
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  cachedVersion = '0.0.0'
  return cachedVersion
}

export interface BootBlockOptions {
  version: string
  elapsedMs: number
  cssBytes: number
  warnings?: number
  watch?: boolean
}

// The boot block: brand + version + ready time, a blank line, then the
// aligned rows — CSS always, warnings only when some rode along, watch
// only for the resident runner. It opens with a blank line and indents two
// spaces, Vite's own frame. Pure over its inputs, so the tests pin it
// verbatim; callers pass the folded count, never the raw total.
export function formatBootBlock(options: BootBlockOptions): string {
  const elapsed = Math.max(0, Math.floor(options.elapsedMs))
  const head = `${paint(BRAND, `${BOLD}${BLUE}`)} ${paint(`v${options.version}`, `${BOLD}${BLUE}`)}  ${paint('ready in', FAINT)} ${paint(String(elapsed), BOLD)}${paint(' ms', FAINT)}`
  const rows = [`${paint(ARROW, BLUE)} ${paint('CSS:'.padEnd(9), BOLD)}  ${paint(formatBytes(options.cssBytes), GREEN)}`]
  const folded = Math.max(0, Math.floor(options.warnings ?? 0))
  if (folded > 0) rows.push(`${paint(ARROW, BLUE)} ${paint('Warnings:'.padEnd(9), BOLD)}  ${paint(String(folded), YELLOW)} [--verbose]`)
  if (options.watch === true) rows.push(`${paint(ARROW, BLUE)} ${paint('Watch:'.padEnd(9), BOLD)}  on`)
  return `\n  ${head}\n\n  ${rows.join('\n  ')}`
}

export interface PrintBootBlockOptions {
  elapsedMs: number
  outDir: string
  warnings?: number
  watch?: boolean
}

// The one-shot and watch-boot success report: measures the sheet the sync
// just published and prints the block with its folded warnings in a single
// write. Errors stay with their commands — loud, full cause, unchanged.
export function printBootBlock(options: PrintBootBlockOptions): void {
  console.log(formatBootBlock({
    version: refVersion(),
    elapsedMs: options.elapsedMs,
    cssBytes: cssSizeBytes(options.outDir),
    warnings: options.warnings ?? 0,
    watch: options.watch ?? false,
  }))
}

// The watch-resync success report: the §3.12 one-liner over the same sheet
// bytes the boot block headlines, with its folded warnings.
export function printSyncLine(elapsedMs: number, outDir: string, warnings = 0): void {
  console.log(formatSyncLine(elapsedMs, cssSizeBytes(outDir), warnings))
}
