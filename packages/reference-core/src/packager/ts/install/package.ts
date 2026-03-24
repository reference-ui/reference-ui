import { join, resolve } from 'node:path'
import {
  writeFileSync,
  mkdirSync,
  existsSync,
  readFileSync,
} from 'node:fs'
import { log } from '../../../lib/log'
import { getDeclarationBasename } from '../../layout'
import { compileDeclarations } from '../compile'
import type { TsPackageInput } from '../types'

const PACKAGER_TS_LOG = 'packager:ts'

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
  projectCwd: string,
  targetDir: string,
  pkg: TsPackageInput
): Promise<void> {
  const entryPath = resolve(cliDir, pkg.sourceEntry)

  if (!existsSync(entryPath)) {
    log.debug(PACKAGER_TS_LOG, `Skipping ${pkg.name} (no ${pkg.sourceEntry})`)
    return
  }

  log.debug(PACKAGER_TS_LOG, `Building types for ${pkg.name}...`)
  mkdirSync(targetDir, { recursive: true })

  const outDtsPath = join(targetDir, getDeclarationBasename(pkg.outFile))
  await compileDeclarations(cliDirForBuild, pkg.sourceEntry, outDtsPath, projectCwd)
  log.debug(PACKAGER_TS_LOG, `✓ Compiled ${pkg.name}`)

  const typesPath = `./${getDeclarationBasename(pkg.outFile)}`
  updatePackageTypes(targetDir, typesPath)

  log.debug(PACKAGER_TS_LOG, `✓ ${pkg.name} ready`)
}
