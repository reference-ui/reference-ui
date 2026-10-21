/**
 * Freshness gate for the reference-rs dist that hostile cases load, run before any child starts.
 * The native addon is verified by its inputs stamp against the current Rust inputs, using the pack-time gate
 * (collectNativeFreshnessIssues); the JS bundle is verified by dist/bundle.inputs.json, which build-bundle.mjs
 * writes beside the outputs. Hashing every Rust input is the expensive part, so the Vitest globalSetup computes the
 * verdict once per run and writes a marker that names the dist state it was computed from; assertRsDistFresh reuses
 * the marker while that state still matches disk, and otherwise computes the verdict once per process. Nothing here
 * runs esbuild or a build, and a stale verdict throws one message that names every stale part.
 */
import fs from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectNativeFreshnessIssues } from '../modules/runtime/js/shared/native-freshness.js'
import {
  hashNativeInputs,
  nativeBinaryFileName,
  nativeStampFileName,
} from '../modules/runtime/js/shared/native-inputs.js'
import { getReferenceNativeTriple, TARGET_TRIPLES } from '../modules/runtime/js/shared/targets.js'
import { BUNDLE_STAMP_FILE, bundleStaleness, digestFile } from '../scripts/bundle-stamp.mjs'

/** The environment variable that names the marker file; the globalSetup sets it, and workers inherit it. */
export const VERDICT_FILE_ENV = 'RS_DIST_VERDICT_FILE'

const PACKAGE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MARKER_VERSION = 1
const MAX_REASONS_SHOWN = 5

/**
 * The dist as it stood when a verdict was computed: the native stamp's text, the bundle stamp's digest, and the digest
 * of each bundle output on disk (null where it is absent). A marker's verdict is reused only while all of it matches.
 */
export interface DistState {
  native: string | null
  bundle: string | null
  outputs: Record<string, string | null>
}

/** A verdict for one package root, with the dist state it was computed from. */
export interface DistVerdictMarker {
  version: number
  packageDir: string
  state: DistState
  reasons: string[]
}

/** Reasons per package root, filled once per process. An empty list means the dist is fresh. */
const verdicts = new Map<string, string[]>()

/** Every reason the dist under `packageDir` is stale; an empty list means it matches its sources. */
export function rsDistStaleness(packageDir: string): string[] {
  return [...nativeStaleness(packageDir), ...bundleStaleness(packageDir)]
}

/**
 * Throws when the dist under `packageDir` (this checkout by default) is stale. The verdict comes from the run's marker
 * when one was computed from the dist as it stands, and is otherwise computed once and reused within the process.
 */
export function assertRsDistFresh(packageDir: string = PACKAGE_DIR): void {
  let reasons = verdicts.get(packageDir)
  if (reasons === undefined) {
    reasons = readCachedVerdict(packageDir) ?? rsDistStaleness(packageDir)
    verdicts.set(packageDir, reasons)
  }
  if (reasons.length > 0) {
    throw new Error(`reference-rs dist is stale: ${describeStaleness(reasons)}; run pnpm agentrs b / build:js`)
  }
}

/**
 * Computes the verdict for `packageDir` and writes it to `file` together with the dist state it was computed from.
 * The state is read first: a rebuild during the hash can then only leave the marker unusable, never make a stale
 * verdict look fresh.
 */
export function writeDistVerdictMarker(file: string, packageDir: string = PACKAGE_DIR): DistVerdictMarker {
  const state = readDistState(packageDir)
  const marker: DistVerdictMarker = {
    version: MARKER_VERSION,
    packageDir,
    state,
    reasons: rsDistStaleness(packageDir),
  }
  fs.writeFileSync(file, `${JSON.stringify(marker)}\n`)
  return marker
}

/** The dist as it stands on disk, read cheaply: the two stamps and the digests of the bundle outputs. */
export function readDistState(packageDir: string): DistState {
  const distDir = join(packageDir, 'dist')
  const bundleStamp = join(distDir, BUNDLE_STAMP_FILE)
  const outputs: Record<string, string | null> = {}
  for (const rel of recordedOutputs(bundleStamp)) {
    outputs[rel] = digestIfPresent(join(distDir, rel))
  }
  return {
    native: readNativeStamp(packageDir),
    bundle: digestIfPresent(bundleStamp),
    outputs,
  }
}

/** The marker's verdict, when the marker is for this root and the dist still matches the state it was computed from. */
function readCachedVerdict(packageDir: string): string[] | undefined {
  const file = process.env[VERDICT_FILE_ENV]
  if (file === undefined || file === '') return undefined
  const marker = readMarker(file)
  if (marker === undefined || marker.packageDir !== packageDir) return undefined
  return sameState(marker.state, readDistState(packageDir)) ? marker.reasons : undefined
}

function readMarker(file: string): DistVerdictMarker | undefined {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<DistVerdictMarker>
    const valid =
      parsed.version === MARKER_VERSION &&
      typeof parsed.packageDir === 'string' &&
      typeof parsed.state === 'object' &&
      parsed.state !== null &&
      Array.isArray(parsed.reasons)
    return valid ? (parsed as DistVerdictMarker) : undefined
  } catch {
    return undefined
  }
}

function sameState(recorded: DistState, current: DistState): boolean {
  if (recorded.native !== current.native || recorded.bundle !== current.bundle) return false
  const keys = Object.keys(recorded.outputs)
  if (keys.length !== Object.keys(current.outputs).length) return false
  return keys.every(key => recorded.outputs[key] === current.outputs[key])
}

function readNativeStamp(packageDir: string): string | null {
  const triple = getReferenceNativeTriple()
  if (triple === null) return null
  const stamp = join(packageDir, 'dist', 'native', nativeStampFileName(triple))
  return fs.existsSync(stamp) ? fs.readFileSync(stamp, 'utf8').trim() : null
}

function recordedOutputs(bundleStamp: string): string[] {
  if (!fs.existsSync(bundleStamp)) return []
  try {
    const stamp = JSON.parse(fs.readFileSync(bundleStamp, 'utf8')) as { outputs?: Record<string, string> }
    return Object.keys(stamp.outputs ?? {})
  } catch {
    return []
  }
}

function digestIfPresent(file: string): string | null {
  return fs.existsSync(file) ? digestFile(file) : null
}

function describeStaleness(reasons: string[]): string {
  const shown = reasons.slice(0, MAX_REASONS_SHOWN)
  const more = reasons.length - shown.length
  return more > 0 ? `${shown.join('; ')}; and ${more} more` : shown.join('; ')
}

function nativeStaleness(packageDir: string): string[] {
  const triple = getReferenceNativeTriple()
  if (triple === null) return [`no native addon target for ${process.platform}-${process.arch}`]
  const binary = nativeBinaryFileName(triple)
  const report = collectNativeFreshnessIssues({
    nativeDirPath: join(packageDir, 'dist', 'native'),
    rustTargets: [TARGET_TRIPLES[triple]],
    currentHash: hashNativeInputs(packageDir),
  })
  return [
    ...report.missing.map(() => `native addon ${binary} is not built`),
    ...report.issues.map(issue => `native addon ${binary}: ${issue.detail}`),
  ]
}
