// Content-addressed versions for Neo generated packages.
// It takes a stage dir holding the assembled packages and emits each package.json with GENERATED_VERSION plus a short SHA-256 over that package's files, package.json excluded.
// Two packages share a version only when their bytes match, so TypeScript never dedupes two different copies of one name and version, and a re-sync that changes nothing rewrites the same bytes.

import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { getPackageDir } from './layout.ts'
import { writePackageJson } from './manifest.ts'
import { PACKAGES } from './packages.ts'

const MANIFEST = 'package.json'
const HASH_LENGTH = 12

/** Regular files under dir as posix paths, sorted; the root manifest is left out because its version is what this computes. */
function emittedFiles(dir: string): string[] {
  const found: string[] = []
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const file = join(current, entry.name)
      if (entry.isDirectory()) walk(file)
      else if (entry.isFile() && !(current === dir && entry.name === MANIFEST)) {
        found.push(relative(dir, file).split(sep).join('/'))
      }
    }
  }
  walk(dir)
  return found.sort()
}

/** Short hex digest over each file's relative path and bytes, in sorted order, so equal trees hash equal. */
export function contentHash(dir: string): string {
  const digest = createHash('sha256')
  for (const rel of emittedFiles(dir)) {
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
export function contentVersion(base: string, dir: string): string {
  return `${base}.${prereleaseSafe(contentHash(dir))}`
}

/** Rewrites each generated package.json with the version its own files earn; the definitions keep the base. */
export function stampContentVersions(outDir: string): void {
  for (const pkg of PACKAGES) {
    const dir = getPackageDir(outDir, pkg.name)
    writePackageJson(dir, { ...pkg, version: contentVersion(pkg.version, dir) })
  }
}
