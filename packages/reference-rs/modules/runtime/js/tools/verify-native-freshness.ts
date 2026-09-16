/**
 * Pack-time freshness gate for shipped native binaries.
 * Compares every .node binary present in dist/native against its inputs stamp
 * and fails closed when a binary is stale or unstamped, so a pack can never
 * silently ship a prebuilt compiled from older sources. Absent binaries are
 * reported but not shipped, and the loader names them loudly at runtime.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { nativeDir, packageDir } from '../shared/paths'
import { hashNativeInputs } from '../shared/native-inputs'
import {
  collectNativeFreshnessIssues,
  formatNativeFreshnessError,
} from '../shared/native-freshness'

interface RustPackageManifest {
  napi?: { targets?: string[] }
}

function readRustTargets(packageDirPath: string): string[] {
  const manifest = JSON.parse(
    readFileSync(join(packageDirPath, 'package.json'), 'utf8')
  ) as RustPackageManifest
  return manifest.napi?.targets ?? []
}

const report = collectNativeFreshnessIssues({
  nativeDirPath: nativeDir,
  rustTargets: readRustTargets(packageDir),
  currentHash: hashNativeInputs(packageDir),
})

if (report.issues.length > 0) {
  throw new Error(formatNativeFreshnessError(report))
}

const verifiedNoun = report.verified.length === 1 ? 'binary' : 'binaries'
console.log(`Verified ${report.verified.length} native ${verifiedNoun}: ${report.verified.join(', ') || '(none)'}`)
if (report.missing.length > 0) {
  const missingNoun = report.missing.length === 1 ? 'binary' : 'binaries'
  console.log(
    `Skipped ${report.missing.length} absent native ${missingNoun} (not shipped): ${report.missing.join(', ')}`
  )
}
