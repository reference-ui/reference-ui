/**
 * Build verification and caching utility for the native .node binary.
 * Computes hash digests over Cargo inputs to avoid redundant compilation passes.
 * Builds the platform-specific native binary via napi-rs when inputs have drifted.
 */
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'

import { getVirtualNativeCompatibilityError } from '../loader'
import { packageDir } from '../shared/paths'
import { getRustTarget, getVirtualNativeTriple } from '../shared/targets'

const triple = getVirtualNativeTriple()
if (!triple) {
  throw new Error('Unsupported platform for @reference-ui/rust native build.')
}

const binaryPath = join(packageDir, 'dist', 'native', `virtual-native.${triple}.node`)
const buildStampPath = join(packageDir, 'dist', 'native', `virtual-native.${triple}.inputs.sha256`)
const nativeInputs = [
  join(packageDir, 'Cargo.toml'),
  join(packageDir, 'Cargo.lock'),
  join(packageDir, 'modules'),
]

/**
 * Hash the rust input tree by file *content*. Mtime-based comparison is
 * unreliable in practice: editors, file syncs, and tooling can write files
 * with preserved or older timestamps, which would fool a mtime check into
 * skipping a needed rebuild and silently shipping a stale .node binary.
 */
function hashNativeInputs(): string {
  const hash = createHash('sha256')

  function visit(path: string): void {
    if (!existsSync(path)) {
      hash.update(`missing:${path}\n`)
      return
    }

    const stats = statSync(path)
    if (!stats.isDirectory()) {
      hash.update(`file:${path}:${stats.size}\n`)
      hash.update(readFileSync(path))
      return
    }

    const entries = readdirSync(path, { withFileTypes: true })
      .map((entry) => entry.name)
      .sort()

    for (const name of entries) {
      visit(join(path, name))
    }
  }

  for (const input of nativeInputs) {
    visit(input)
  }

  return hash.digest('hex')
}

function readBuildStamp(): string | null {
  if (!existsSync(buildStampPath)) {
    return null
  }

  try {
    return readFileSync(buildStampPath, 'utf8').trim()
  } catch {
    return null
  }
}

function writeBuildStamp(stamp: string): void {
  mkdirSync(dirname(buildStampPath), { recursive: true })
  writeFileSync(buildStampPath, `${stamp}\n`)
}

const currentInputsHash = hashNativeInputs()

if (existsSync(binaryPath)) {
  const recordedInputsHash = readBuildStamp()
  if (recordedInputsHash !== currentInputsHash) {
    console.log(`Rebuilding stale native binary ${binaryPath}: rust inputs changed`)
  } else {
    try {
      const require = createRequire(import.meta.url)
      const binding = require(binaryPath) as Record<string, unknown>
      const compatibilityError = getVirtualNativeCompatibilityError(binding)
      if (!compatibilityError) {
        console.log(`Using existing native binary ${binaryPath}`)
        process.exit(0)
      }

      console.log(`Rebuilding stale native binary ${binaryPath}: ${compatibilityError}`)
    } catch {
      console.log(`Rebuilding unloadable native binary ${binaryPath}`)
    }
  }
}

const target = getRustTarget(triple)
console.log(`Building native binary for ${target}`)

execFileSync('pnpm', ['run', 'build:native', '--', '--target', target], {
  cwd: packageDir,
  stdio: 'inherit',
  env: process.env,
})

writeBuildStamp(currentInputsHash)
