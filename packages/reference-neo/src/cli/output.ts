// CLI printing helpers: they take exit-bound messages and emit the human
// lines. The usage block, the error-cause formatter, and the one-line sync
// success shape live here so every command reports the same way. Colors
// follow the terminal (FORCE_COLOR forces, NO_COLOR kills); piped runs
// stay plain. Output strings are pinned by the bin tests and the CLI
// cases — change them only with the pins.
import { readdirSync, statSync } from 'node:fs'
import type { Dirent } from 'node:fs'
import { join } from 'node:path'

export const USAGE = 'usage: ref <sync|clean> [dir]\n       ref sync --watch [dir]'

const GLYPH = '⎔'
const SEPARATOR = '⫶'

const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const FAINT = '\x1b[2m'
const GREEN = '\x1b[32m'
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
