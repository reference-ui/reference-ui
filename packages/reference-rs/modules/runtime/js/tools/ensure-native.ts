/**
 * Build verification and caching utility for the native .node binary.
 * Computes hash digests over Cargo inputs to avoid redundant compilation passes.
 * Builds the platform-specific native binary via napi-rs when inputs have drifted.
 */
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'

import { getVirtualNativeCompatibilityError } from '../loader'
import { nativeDir, packageDir } from '../shared/paths'
import {
  hashNativeInputs,
  nativeBinaryFileName,
  nativeStampFileName,
} from '../shared/native-inputs'
import { getRustTarget, getVirtualNativeTriple } from '../shared/targets'

const triple = getVirtualNativeTriple()
if (!triple) {
  throw new Error('Unsupported platform for @reference-ui/rust native build.')
}

const binaryPath = join(nativeDir, nativeBinaryFileName(triple))
const buildStampPath = join(nativeDir, nativeStampFileName(triple))

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

const currentInputsHash = hashNativeInputs(packageDir)

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
