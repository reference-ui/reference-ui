// Content-addressed versions for Core generated packages.
// It takes a stage dir holding the assembled packages and emits each package.json with GENERATED_VERSION plus a short SHA-256 over that package's versioned files.
// Versioned means what assembly writes for the package: the root manifest is out (its version is the output), and so are the entries other owners land after the stamp (sync's compile-request diagnostic, the session-owned tasty dir and its writer temps).
// Two packages share a version only when their bytes match, so TypeScript never dedupes two different copies of one name and version, and a re-sync that changes nothing rewrites the same bytes.

import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { getPackageDir } from './layout.ts'
import { writePackageJson } from './manifest.ts'
import { PACKAGES, SYSTEM_PACKAGE, TYPES_PACKAGE } from './packages.ts'
import type { PackageDefinition } from './package/index.ts'

const MANIFEST = 'package.json'
const HASH_LENGTH = 12

/**
 * Root entries a package's version never hashes, by package name: each lands
 * after the stamp from another owner. compile-request.json is sync's diagnostic
 * beside the system leg; the tasty dir is the background tasty phase's (sync
 * preserves it), and `tasty.tmp-*` are its writer temps.
 */
const UNVERSIONED_ROOT_ENTRIES: Readonly<Record<string, readonly string[]>> = {
  [SYSTEM_PACKAGE.name]: ['compile-request.json'],
  [TYPES_PACKAGE.name]: ['tasty'],
}
const UNVERSIONED_ROOT_PREFIXES: Readonly<Record<string, readonly string[]>> = {
  [TYPES_PACKAGE.name]: ['tasty.tmp-'],
}

/** The root-level entry names a package's hash skips: its manifest plus the late entries other owners land. */
function isUnversionedRootEntry(name: string, pkgName: string | undefined): boolean {
  if (name === MANIFEST) return true
  if (pkgName === undefined) return false
  if (UNVERSIONED_ROOT_ENTRIES[pkgName]?.includes(name)) return true
  return UNVERSIONED_ROOT_PREFIXES[pkgName]?.some((prefix) => name.startsWith(prefix)) ?? false
}

/** Regular files under dir as posix paths, sorted; unversioned root entries are left out. */
function versionedFiles(dir: string, pkgName: string | undefined): string[] {
  const found: string[] = []
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (current === dir && isUnversionedRootEntry(entry.name, pkgName)) continue
      const file = join(current, entry.name)
      if (entry.isDirectory()) walk(file)
      else if (entry.isFile()) found.push(relative(dir, file).split(sep).join('/'))
    }
  }
  walk(dir)
  return found.sort()
}

/**
 * Short hex digest over each versioned file's relative path and bytes, in sorted
 * order, so equal trees hash equal. Without a package name only the manifest is skipped.
 */
export function contentHash(dir: string, pkgName?: string): string {
  const digest = createHash('sha256')
  for (const rel of versionedFiles(dir, pkgName)) {
    digest.update(`${rel}\0`)
    digest.update(readFileSync(join(dir, rel)))
    digest.update('\0')
  }
  return digest.digest('hex').slice(0, HASH_LENGTH)
}

// A prerelease identifier made only of digits may not carry a leading zero, so an all-digit hash keeps one letter.
function prereleaseSafe(hash: string): string {
  return /[a-f]/.test(hash) ? hash : `a${hash.slice(1)}`
}

/** The package version for a directory: the base, a dot, and the content hash. */
export function contentVersion(base: string, dir: string, pkgName?: string): string {
  return `${base}.${prereleaseSafe(contentHash(dir, pkgName))}`
}

/** The version a generated package's own versioned files earn. */
export function packageContentVersion(pkg: PackageDefinition, dir: string): string {
  return contentVersion(pkg.version, dir, pkg.name)
}

/** Rewrites each generated package.json with the version its own files earn; the definitions keep the base. */
export function stampContentVersions(outDir: string): void {
  for (const pkg of PACKAGES) {
    const dir = getPackageDir(outDir, pkg.name)
    writePackageJson(dir, { ...pkg, version: packageContentVersion(pkg, dir) })
  }
}

export interface StampMismatch {
  name: string
  stamped: string
  recomputed: string
}

/** Recomputes every generated package's version under outDir and names each stamp that disagrees. */
export function findStampMismatches(outDir: string): StampMismatch[] {
  const mismatches: StampMismatch[] = []
  for (const pkg of PACKAGES) {
    const dir = getPackageDir(outDir, pkg.name)
    const stamped = (JSON.parse(readFileSync(join(dir, MANIFEST), 'utf-8')) as { version: string }).version
    const recomputed = packageContentVersion(pkg, dir)
    if (stamped !== recomputed) mismatches.push({ name: pkg.name, stamped, recomputed })
  }
  return mismatches
}
