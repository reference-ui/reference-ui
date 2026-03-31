import { join, resolve } from 'node:path'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { log } from '../../../lib/log'
import { getDeclarationBasename } from '../../layout'
import { compileDeclarations } from '../compile'
import type { TsPackageInput } from '../types'

const PACKAGER_TS_LOG = 'packager:ts'

interface InstallPackageTsOptions {
  cliDir: string
  cliDirForBuild: string
  projectCwd: string
  targetDir: string
}

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
  options: InstallPackageTsOptions,
  pkg: TsPackageInput
): Promise<void> {
  const entryPath = resolve(options.cliDir, pkg.sourceEntry)

  if (!existsSync(entryPath)) {
    log.debug(PACKAGER_TS_LOG, `Skipping ${pkg.name} (no ${pkg.sourceEntry})`)
    return
  }

  log.debug(PACKAGER_TS_LOG, `Building types for ${pkg.name}...`)
  mkdirSync(options.targetDir, { recursive: true })

  const outDtsPath = join(options.targetDir, getDeclarationBasename(pkg.outFile))
  await compileDeclarations(
    options.cliDirForBuild,
    pkg.sourceEntry,
    outDtsPath,
    options.projectCwd
  )
  log.debug(PACKAGER_TS_LOG, `✓ Compiled ${pkg.name}`)

  const typesPath = `./${getDeclarationBasename(pkg.outFile)}`
  updatePackageTypes(options.targetDir, typesPath)

  log.debug(PACKAGER_TS_LOG, `✓ ${pkg.name} ready`)
}
