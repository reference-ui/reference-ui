/**
 * Content hashing for Rust native inputs shared by build and pack tooling.
 * Frames every entry relative to the package root so stamps stay portable
 * across CI runners and developer checkouts with different absolute paths.
 * Covers exactly the files cargo reads for the build: the workspace manifest,
 * the lockfile, and every crate manifest plus Rust source under modules/.
 * Test fixtures, generated goldens, and dependency directories are not binary
 * inputs, so they stay out of the hash and cannot churn stamps spuriously.
 */
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

export const NATIVE_INPUT_ROOTS = ['Cargo.toml', 'Cargo.lock', 'modules'] as const

const RUST_SOURCE_SUFFIX = '.rs'
const CARGO_MANIFEST = 'Cargo.toml'

function isHashedFile(relativePosix: string): boolean {
  if (relativePosix === 'Cargo.toml' || relativePosix === 'Cargo.lock') return true
  if (!relativePosix.startsWith('modules/')) return false
  const base = relativePosix.slice(relativePosix.lastIndexOf('/') + 1)
  return base === CARGO_MANIFEST || base.endsWith(RUST_SOURCE_SUFFIX)
}

export function nativeBinaryFileName(triple: string): string {
  return `virtual-native.${triple}.node`
}

export function nativeStampFileName(triple: string): string {
  return `virtual-native.${triple}.inputs.sha256`
}

function framePath(packageDir: string, path: string): string {
  return relative(packageDir, path).split(sep).join('/')
}

function hashFile(
  hash: ReturnType<typeof createHash>,
  packageDir: string,
  path: string
): void {
  const stats = statSync(path)
  hash.update(`file:${framePath(packageDir, path)}:${stats.size}\n`)
  hash.update(readFileSync(path))
}

function hashSortedDir(
  hash: ReturnType<typeof createHash>,
  packageDir: string,
  path: string,
  visit: (path: string) => void
): void {
  const entries = readdirSync(path, { withFileTypes: true })
    .map(entry => entry.name)
    .sort()
  for (const name of entries) {
    visit(join(path, name))
  }
}

/**
 * Hash the rust input tree by file *content*. Mtime-based comparison is
 * unreliable in practice: editors, file syncs, and tooling can write files
 * with preserved or older timestamps, which would fool a mtime check into
 * skipping a needed rebuild and silently shipping a stale .node binary.
 */
export function hashNativeInputs(packageDir: string): string {
  const hash = createHash('sha256')

  function visit(path: string): void {
    if (!existsSync(path)) {
      hash.update(`missing:${framePath(packageDir, path)}\n`)
      return
    }
    if (!statSync(path).isDirectory()) {
      if (isHashedFile(framePath(packageDir, path))) {
        hashFile(hash, packageDir, path)
      }
      return
    }
    hashSortedDir(hash, packageDir, path, visit)
  }

  for (const root of NATIVE_INPUT_ROOTS) {
    visit(join(packageDir, root))
  }

  return hash.digest('hex')
}
