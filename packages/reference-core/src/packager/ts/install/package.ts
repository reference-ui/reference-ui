import { join, resolve } from 'node:path'
import {
  writeFileSync,
  mkdirSync,
  existsSync,
  readFileSync,
} from 'node:fs'
import { log } from '../../../lib/log'
import { compileDeclarations } from '../compile'
import type { TsPackageInput } from '../types'

/**
 * Update package.json types and exports.types in place.
 */
function updatePackageTypes(packageDir: string, typesPath: string): void {
  const pkgJsonPath = join(packageDir, 'package.json')
  if (!existsSync(pkgJsonPath)) return

  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
  pkgJson.types = typesPath
  if (pkgJson.exports?.['.'] && typeof pkgJson.exports['.'] === 'object') {
    pkgJson.exports['.'].types = typesPath
  }
  writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2), 'utf-8')
}

/**
 * Install types for a single package: compile from source entry, write .d.mts to targetDir, update package.json.
 */
export async function installPackageTs(
  cliDir: string,
  cliDirForBuild: string,
  targetDir: string,
  pkg: TsPackageInput
): Promise<void> {
  const entryPath = resolve(cliDir, pkg.sourceEntry)

  if (!existsSync(entryPath)) {
    log.debug('packager:ts', `Skipping ${pkg.name} (no ${pkg.sourceEntry})`)
    return
  }

  log.debug('packager:ts', `Building types for ${pkg.name}...`)
  mkdirSync(targetDir, { recursive: true })

  const outDtsPath = join(targetDir, pkg.outFile.replace(/\.m?js$/, '.d.mts'))
  await compileDeclarations(cliDirForBuild, pkg.sourceEntry, outDtsPath)
  log.debug('packager:ts', `✓ Compiled ${pkg.name}`)

  const typesPath = `./${pkg.outFile.replace(/\.m?js$/, '.d.mts')}`
  updatePackageTypes(targetDir, typesPath)

  log.debug('packager:ts', `✓ ${pkg.name} ready`)
}
