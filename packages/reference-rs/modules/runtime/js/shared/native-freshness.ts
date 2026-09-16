/**
 * Freshness logic for shipped native binaries shared by pack tooling.
 * Compares recorded inputs stamps against the current rust content hash and
 * records new stamps for freshly compiled targets. Pure path-in functions
 * so tests exercise the gate without touching the real distribution tree.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import {
  hashNativeInputs,
  nativeBinaryFileName,
  nativeStampFileName,
} from './native-inputs'
import {
  SUPPORTED_VIRTUAL_NATIVE_TARGETS,
  TARGET_TRIPLES,
  type VirtualNativeTarget,
} from './targets'

export type NativeFreshnessKind =
  | 'missing-binary'
  | 'missing-stamp'
  | 'stale-binary'
  | 'unknown-target'

export interface NativeFreshnessIssue {
  triple: string
  kind: Exclude<NativeFreshnessKind, 'missing-binary'>
  detail: string
}

export interface NativeFreshnessReport {
  verified: VirtualNativeTarget[]
  missing: VirtualNativeTarget[]
  issues: NativeFreshnessIssue[]
}

export function tripleForRustTarget(rustTarget: string): VirtualNativeTarget | null {
  for (const [triple, mapped] of Object.entries(TARGET_TRIPLES)) {
    if (mapped === rustTarget) return triple as VirtualNativeTarget
  }
  return null
}

function readRecordedStamp(nativeDirPath: string, triple: string): string | null {
  const stampPath = join(nativeDirPath, nativeStampFileName(triple))
  if (!existsSync(stampPath)) return null
  try {
    return readFileSync(stampPath, 'utf8').trim()
  } catch {
    return null
  }
}

function checkTriple(
  nativeDirPath: string,
  triple: VirtualNativeTarget,
  rustTarget: string,
  currentHash: string,
  report: NativeFreshnessReport
): void {
  if (!existsSync(join(nativeDirPath, nativeBinaryFileName(triple)))) {
    report.missing.push(triple)
    return
  }
  const recorded = readRecordedStamp(nativeDirPath, triple)
  if (recorded === null) {
    report.issues.push({
      triple,
      kind: 'missing-stamp',
      detail:
        `has no inputs stamp; rebuild with \`napi build --target ${rustTarget}\` ` +
        `and record the stamp, or remove the binary so it cannot ship stale`,
    })
    return
  }
  if (recorded !== currentHash) {
    report.issues.push({
      triple,
      kind: 'stale-binary',
      detail:
        `stamp ${recorded.slice(0, 12)}… does not match current rust inputs ` +
        `${currentHash.slice(0, 12)}…; rebuild with \`napi build --target ${rustTarget}\``,
    })
    return
  }
  report.verified.push(triple)
}

export function collectNativeFreshnessIssues(options: {
  nativeDirPath: string
  rustTargets: readonly string[]
  currentHash: string
}): NativeFreshnessReport {
  const report: NativeFreshnessReport = { verified: [], missing: [], issues: [] }
  for (const rustTarget of options.rustTargets) {
    const triple = tripleForRustTarget(rustTarget)
    if (!triple) {
      report.issues.push({
        triple: rustTarget,
        kind: 'unknown-target',
        detail: 'is not a supported virtual-native target triple',
      })
      continue
    }
    checkTriple(options.nativeDirPath, triple, rustTarget, options.currentHash, report)
  }
  return report
}

export function formatNativeFreshnessError(report: NativeFreshnessReport): string {
  const lines = report.issues.map(issue => `  - ${issue.triple}: ${issue.detail}`)
  return [
    'Refusing to pack @reference-ui/rust with stale or unstamped native binaries:',
    ...lines,
    'Rebuild the listed targets from current sources and re-run pack.',
  ].join('\n')
}

export function writeNativeStamp(options: {
  nativeDirPath: string
  packageDirPath: string
  triple: string
}): string {
  if (!SUPPORTED_VIRTUAL_NATIVE_TARGETS.includes(options.triple as VirtualNativeTarget)) {
    throw new Error(
      `Cannot stamp unknown native triple ${JSON.stringify(options.triple)}. ` +
        `Supported targets: ${SUPPORTED_VIRTUAL_NATIVE_TARGETS.join(', ')}.`
    )
  }
  const binaryPath = join(options.nativeDirPath, nativeBinaryFileName(options.triple))
  if (!existsSync(binaryPath)) {
    throw new Error(
      `Cannot stamp ${options.triple}: missing binary at ${binaryPath}. Build it first.`
    )
  }
  const stampPath = join(options.nativeDirPath, nativeStampFileName(options.triple))
  const stamp = hashNativeInputs(options.packageDirPath)
  mkdirSync(dirname(stampPath), { recursive: true })
  writeFileSync(stampPath, `${stamp}\n`)
  return stampPath
}
