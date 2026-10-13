/**
 * Freshness logic for shipped native binaries shared by pack tooling.
 * Compares recorded inputs stamps against the current rust content hash and
 * records new stamps for freshly compiled targets. Pure path-in functions
 * so tests exercise the gate without touching the real distribution tree.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

// Explicit .js specifiers: the pipeline type-checks this file under NodeNext.
import {
  hashNativeInputs,
  nativeBinaryFileName,
  nativeStampFileName,
} from './native-inputs.js'
import {
  SUPPORTED_REFERENCE_NATIVE_TARGETS,
  TARGET_TRIPLES,
  type ReferenceNativeTarget,
} from './targets.js'

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
  verified: ReferenceNativeTarget[]
  missing: ReferenceNativeTarget[]
  issues: NativeFreshnessIssue[]
}

export function tripleForRustTarget(rustTarget: string): ReferenceNativeTarget | null {
  for (const [triple, mapped] of Object.entries(TARGET_TRIPLES)) {
    if (mapped === rustTarget) return triple as ReferenceNativeTarget
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
  triple: ReferenceNativeTarget,
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
        detail: 'is not a supported reference-native target triple',
      })
      continue
    }
    checkTriple(options.nativeDirPath, triple, rustTarget, options.currentHash, report)
  }
  return report
}

const ARTIFACT_BINARY_PATTERN = /^reference-native\.(.+)\.node$/

/**
 * Checks every native binary under a downloaded-artifacts dir (the dir itself and
 * one level of per-target subdirs, the layout of a CI artifact download) against
 * its sibling stamp. Publishing reads these binaries, so a stale one must stop it.
 */
export function collectArtifactFreshnessIssues(options: {
  artifactsDirPath: string
  currentHash: string
}): NativeFreshnessReport {
  const report: NativeFreshnessReport = { verified: [], missing: [], issues: [] }
  const dirs = [
    options.artifactsDirPath,
    ...readdirSync(options.artifactsDirPath, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => join(options.artifactsDirPath, entry.name)),
  ]

  for (const dir of dirs) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const triple = entry.isFile() ? ARTIFACT_BINARY_PATTERN.exec(entry.name)?.[1] : undefined
      if (!triple) continue

      const rustTarget = TARGET_TRIPLES[triple as ReferenceNativeTarget]
      const dirReport = collectNativeFreshnessIssues({
        nativeDirPath: dir,
        rustTargets: [rustTarget ?? triple],
        currentHash: options.currentHash,
      })
      report.verified.push(...dirReport.verified)
      report.issues.push(...dirReport.issues.map(issue => ({ ...issue, detail: `(${dir}) ${issue.detail}` })))
    }
  }
  return report
}

export function formatNativeFreshnessError(
  report: NativeFreshnessReport,
  action: 'pack' | 'publish' = 'pack'
): string {
  const lines = report.issues.map(issue => `  - ${issue.triple}: ${issue.detail}`)
  return [
    `Refusing to ${action} @reference-ui/rust with stale or unstamped native binaries:`,
    ...lines,
    `Rebuild the listed targets from current sources and re-run ${action}.`,
  ].join('\n')
}

/**
 * Records the inputs stamp beside a binary. Callers that compile should pass
 * `inputsHash` captured before the build starts: hashing after the compile
 * could stamp a binary with sources it was not built from.
 */
export function writeNativeStamp(options: {
  nativeDirPath: string
  packageDirPath: string
  triple: string
  inputsHash?: string
}): string {
  if (!SUPPORTED_REFERENCE_NATIVE_TARGETS.includes(options.triple as ReferenceNativeTarget)) {
    throw new Error(
      `Cannot stamp unknown native triple ${JSON.stringify(options.triple)}. ` +
        `Supported targets: ${SUPPORTED_REFERENCE_NATIVE_TARGETS.join(', ')}.`
    )
  }
  const binaryPath = join(options.nativeDirPath, nativeBinaryFileName(options.triple))
  if (!existsSync(binaryPath)) {
    throw new Error(
      `Cannot stamp ${options.triple}: missing binary at ${binaryPath}. Build it first.`
    )
  }
  const stampPath = join(options.nativeDirPath, nativeStampFileName(options.triple))
  const stamp = options.inputsHash ?? hashNativeInputs(options.packageDirPath)
  mkdirSync(dirname(stampPath), { recursive: true })
  writeFileSync(stampPath, `${stamp}\n`)
  return stampPath
}
