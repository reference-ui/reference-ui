/**
 * Rust native binary compatibility helpers.
 *
 * This module owns the checks that decide whether a generated `.node` artifact
 * is safe to reuse for packaging. Host-runnable binaries get the same runtime
 * compatibility check as production loading; non-runnable targets fall back to
 * a static marker scan.
 */

import { copyFileSync, existsSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'

import {
  getReferenceNativeTriple,
  type ReferenceNativeTarget,
} from '../../../../packages/reference-rs/modules/runtime/js/shared/targets.js'
import { REQUIRED_REFERENCE_NATIVE_BINARY_MARKERS } from '../../../../packages/reference-rs/modules/runtime/js/shared/native-contract.js'
import { getReferenceNativeCompatibilityError } from '../../../../packages/reference-rs/modules/runtime/js/loader.js'

const requireFromPipeline = createRequire(import.meta.url)

export interface ReferenceRustBinaryCompatibilityOptions {
  binaryPath: string
  fileCompatibilityCheck?: (binaryPath: string) => boolean
  hostRuntimeCompatibilityCheck?: (binaryPath: string, target: ReferenceNativeTarget) => boolean
  hostTarget?: ReferenceNativeTarget | null
  target: ReferenceNativeTarget
}

export function hasCompatibleReferenceRustBinaryContents(contents: Buffer): boolean {
  return REQUIRED_REFERENCE_NATIVE_BINARY_MARKERS.every(marker => contents.includes(Buffer.from(marker)))
}

function hasCompatibleReferenceRustBinaryFile(binaryPath: string): boolean {
  if (!existsSync(binaryPath)) {
    return false
  }

  return hasCompatibleReferenceRustBinaryContents(readFileSync(binaryPath))
}

function hasHostRuntimeCompatibleReferenceRustBinary(
  binaryPath: string,
  target: ReferenceNativeTarget,
): boolean {
  if (getReferenceNativeTriple() !== target) {
    return false
  }

  const validationPath = resolve(
    dirname(binaryPath),
    `.runtime-check-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.node`,
  )

  try {
    copyFileSync(binaryPath, validationPath)
    const binding = requireFromPipeline(validationPath) as Record<string, unknown>
    return getReferenceNativeCompatibilityError(binding) === null
  } catch {
    return false
  } finally {
    rmSync(validationPath, { force: true })
  }
}

export function isReferenceRustBinaryCompatible(
  options: ReferenceRustBinaryCompatibilityOptions,
): boolean {
  const hostTarget = options.hostTarget ?? getReferenceNativeTriple()
  const hostRuntimeCompatibilityCheck =
    options.hostRuntimeCompatibilityCheck ?? hasHostRuntimeCompatibleReferenceRustBinary
  const fileCompatibilityCheck = options.fileCompatibilityCheck ?? hasCompatibleReferenceRustBinaryFile

  if (hostTarget === options.target && hostRuntimeCompatibilityCheck(options.binaryPath, options.target)) {
    return true
  }

  return fileCompatibilityCheck(options.binaryPath)
}
