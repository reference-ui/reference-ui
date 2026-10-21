/**
 * Input stamp for the published JS bundle, shared by the build and the test runner. build-bundle.mjs records a sha256
 * for every file esbuild read and every option file, and for every output it wrote, in dist/bundle.inputs.json.
 * bundleStaleness re-hashes exactly those files, so it answers whether dist still matches its sources without running
 * esbuild; a few hundred kilobytes of reads keep it cheap enough to run in every process that loads dist.
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export const BUNDLE_STAMP_FILE = 'bundle.inputs.json'

/** Files the bundle reads beyond its module graph: the options live here, so a change to any of them stales the bundle. */
export const BUNDLE_OPTION_FILES = ['scripts/build-bundle.mjs', 'tsconfig.json', 'package.json']

export function digestFile(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

/**
 * Returns one reason per input or output that no longer matches the stamp, or one reason when the stamp is missing
 * or malformed. An empty list means every recorded input and output is byte for byte what the build recorded.
 */
export function bundleStaleness(packageDir) {
  const stampPath = join(packageDir, 'dist', BUNDLE_STAMP_FILE)
  if (!existsSync(stampPath)) return [`no bundle inputs stamp at dist/${BUNDLE_STAMP_FILE}`]
  const stamp = readStamp(stampPath)
  if (stamp === undefined) return ['bundle inputs stamp is malformed']
  const distDir = join(packageDir, 'dist')
  return [
    ...differingFiles(stamp.inputs, packageDir, '', 'changed since the bundle was built'),
    ...differingFiles(stamp.outputs, distDir, 'dist/', 'was overwritten after the bundle was built'),
  ]
}

function readStamp(stampPath) {
  let stamp
  try {
    stamp = JSON.parse(readFileSync(stampPath, 'utf8'))
  } catch {
    return undefined
  }
  const valid = stamp !== null && typeof stamp.inputs === 'object' && typeof stamp.outputs === 'object'
  return valid ? stamp : undefined
}

/** Each recorded path, resolved under `base`, must still exist with the recorded digest; `prefix` labels the reason. */
function differingFiles(recorded, base, prefix, problem) {
  const reasons = []
  for (const [rel, digest] of Object.entries(recorded)) {
    const file = join(base, rel)
    const label = `${prefix}${rel}`
    if (!existsSync(file)) reasons.push(`${label} is missing`)
    else if (digestFile(file) !== digest) reasons.push(`${label} ${problem}`)
  }
  return reasons
}
