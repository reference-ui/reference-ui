/**
 * Content hashing for Rust native inputs shared by build and pack tooling.
 * Frames every entry relative to the package root so stamps stay portable
 * across CI runners and developer checkouts with different absolute paths.
 * Covers exactly the files cargo reads for the build: the workspace manifest,
 * the lockfile, and every crate manifest plus Rust source under modules/.
 * Test fixtures, generated goldens, and dependency directories are not binary
 * inputs, so they stay out of the hash and cannot churn stamps spuriously.
 * The walk takes each entry's type from its parent listing instead of a stat per
 * file, so the hash runs in a per-process freshness check; its bytes are unchanged.
 */
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync, type Dirent } from 'node:fs'
import { join } from 'node:path'

export const NATIVE_INPUT_ROOTS = ['Cargo.toml', 'Cargo.lock', 'modules'] as const

const RUST_SOURCE_SUFFIX = '.rs'
const CARGO_MANIFEST = 'Cargo.toml'

/** One entry the hash folds in: a hashed file, or a root absent from the checkout (no `abs`). */
interface InputEntry {
  rel: string
  abs?: string
}

function isHashedFile(relativePosix: string): boolean {
  if (relativePosix === 'Cargo.toml' || relativePosix === 'Cargo.lock') return true
  if (!relativePosix.startsWith('modules/')) return false
  const base = relativePosix.slice(relativePosix.lastIndexOf('/') + 1)
  return base === CARGO_MANIFEST || base.endsWith(RUST_SOURCE_SUFFIX)
}

export function nativeBinaryFileName(triple: string): string {
  return `reference-native.${triple}.node`
}

export function nativeStampFileName(triple: string): string {
  return `reference-native.${triple}.inputs.sha256`
}

/**
 * Folds CRLF to LF. Windows checkouts with core.autocrlf set rewrite text files
 * to CRLF, which would give the same sources a different hash from macOS and
 * Linux. LF-only content is returned byte for byte, so existing stamps still match.
 */
function withLfLineEndings(contents: Buffer): Buffer {
  if (contents.indexOf('\r\n') === -1) return contents
  return Buffer.from(contents.toString('latin1').replace(/\r\n/g, '\n'), 'latin1')
}

function hashFile(hash: ReturnType<typeof createHash>, rel: string, abs: string): void {
  const contents = withLfLineEndings(readFileSync(abs))
  hash.update(`file:${rel}:${contents.length}\n`)
  hash.update(contents)
}

function byName(a: Dirent, b: Dirent): number {
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0
}

/**
 * The kind of one path. The parent's listing already says file or directory for an ordinary entry; a symlink,
 * an unknown type, or a root (no listing) is resolved by stat, the way the hash always did.
 */
function entryKind(abs: string, known: Dirent | undefined): 'missing' | 'dir' | 'file' {
  if (known !== undefined && (known.isDirectory() || known.isFile())) {
    return known.isDirectory() ? 'dir' : 'file'
  }
  if (!existsSync(abs)) return 'missing'
  return statSync(abs).isDirectory() ? 'dir' : 'file'
}

/**
 * Appends the hashed inputs under `rel` in fold order: each directory's entries sorted by name, depth first.
 * Each directory is listed once; a file is kept only when it is a Cargo manifest or a Rust source.
 */
function collectInputs(packageDir: string, rel: string, known: Dirent | undefined, out: InputEntry[]): void {
  const abs = join(packageDir, rel)
  const kind = entryKind(abs, known)
  if (kind === 'missing') {
    out.push({ rel })
    return
  }
  if (kind === 'file') {
    if (isHashedFile(rel)) out.push({ rel, abs })
    return
  }
  for (const entry of readdirSync(abs, { withFileTypes: true }).sort(byName)) {
    collectInputs(packageDir, `${rel}/${entry.name}`, entry, out)
  }
}

/**
 * Hash the rust input tree by file *content*. Mtime-based comparison is
 * unreliable in practice: editors, file syncs, and tooling can write files
 * with preserved or older timestamps, which would fool a mtime check into
 * skipping a needed rebuild and silently shipping a stale .node binary.
 */
export function hashNativeInputs(packageDir: string): string {
  const inputs: InputEntry[] = []
  for (const root of NATIVE_INPUT_ROOTS) {
    collectInputs(packageDir, root, undefined, inputs)
  }

  const hash = createHash('sha256')
  for (const input of inputs) {
    if (input.abs === undefined) {
      hash.update(`missing:${input.rel}\n`)
    } else {
      hashFile(hash, input.rel, input.abs)
    }
  }
  return hash.digest('hex')
}
