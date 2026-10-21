/**
 * Freshness gate for the reference-rs dist that hostile cases load, run before any child starts.
 * The native addon is verified by its inputs stamp against the current Rust inputs, using the pack-time gate
 * (collectNativeFreshnessIssues); the JS bundle is verified by dist/bundle.inputs.json, which build-bundle.mjs
 * writes beside the outputs. assertRsDistFresh decides once per package root per process and throws one message that
 * names every stale part, so a case never silently measures an old build. It runs no esbuild and no build.
 */
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectNativeFreshnessIssues } from '../modules/runtime/js/shared/native-freshness.js'
import { hashNativeInputs, nativeBinaryFileName } from '../modules/runtime/js/shared/native-inputs.js'
import { getReferenceNativeTriple, TARGET_TRIPLES } from '../modules/runtime/js/shared/targets.js'
import { bundleStaleness } from '../scripts/bundle-stamp.mjs'

const PACKAGE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MAX_REASONS_SHOWN = 5

/** Verdict per package root: null when fresh, otherwise the joined reasons. Filled once per process. */
const verdicts = new Map<string, string | null>()

/** Every reason the dist under `packageDir` is stale; an empty list means it matches its sources. */
export function rsDistStaleness(packageDir: string): string[] {
  return [...nativeStaleness(packageDir), ...bundleStaleness(packageDir)]
}

/**
 * Throws when the dist under `packageDir` (this checkout by default) is stale. The verdict is computed once per
 * root and reused, so each process pays the check a single time however many isolated calls it makes.
 */
export function assertRsDistFresh(packageDir: string = PACKAGE_DIR): void {
  let verdict = verdicts.get(packageDir)
  if (verdict === undefined) {
    verdict = describeStaleness(rsDistStaleness(packageDir))
    verdicts.set(packageDir, verdict)
  }
  if (verdict !== null) {
    throw new Error(`reference-rs dist is stale: ${verdict}; run pnpm agentrs b / build:js`)
  }
}

function describeStaleness(reasons: string[]): string | null {
  if (reasons.length === 0) return null
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
