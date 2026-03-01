import { join, resolve, relative, dirname } from 'node:path'
import {
  writeFileSync,
  mkdirSync,
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  copyFileSync,
} from 'node:fs'
import { log } from '../../lib/log'
import { compileDeclarations } from '../compile'

export interface TsPackageInput {
  name: string
  sourceEntry: string
  outFile: string
}

/** Copy pre-existing .d.ts files from source (Panda CSS generated decls) */
function copyExistingDeclarations(
  srcDir: string,
  destDir: string,
  rootDir: string
): void {
  if (!existsSync(srcDir)) return

  for (const entry of readdirSync(srcDir)) {
    const srcPath = join(srcDir, entry)
    const stat = statSync(srcPath)
    if (stat.isDirectory()) {
      copyExistingDeclarations(srcPath, destDir, rootDir)
    } else if (stat.isFile() && entry.endsWith('.d.ts')) {
      const destPath = join(destDir, relative(rootDir, srcPath))
      mkdirSync(dirname(destPath), { recursive: true })
      copyFileSync(srcPath, destPath)
    }
  }
}

/** Update package.json types and exports fields */
function updatePackageTypes(packageDir: string, typesPath: string): void {
  const pkgJsonPath = join(packageDir, 'package.json')
  if (!existsSync(pkgJsonPath)) return

  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
  pkgJson.types = typesPath
  if (pkgJson.exports?.['.']) {
    pkgJson.exports['.'].types = typesPath
  }
  writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2), 'utf-8')
}

/**
 * Install types for a single package: compile, copy extras, update package.json.
 */
export async function installPackageTs(
  coreDir: string,
  buildCoreDir: string,
  userProjectDir: string,
  pkg: TsPackageInput
): Promise<void> {
  const packageDir = join(userProjectDir, 'node_modules', pkg.name)
  const entryPath = resolve(coreDir, pkg.sourceEntry)

  if (!existsSync(entryPath)) {
    log.debug('packager:ts', `Skipping ${pkg.name} (no ${pkg.sourceEntry})`)
    return
  }

  log.debug('packager:ts', `Building types for ${pkg.name}...`)
  mkdirSync(packageDir, { recursive: true })

  const outDtsPath = join(packageDir, pkg.outFile.replace(/\.m?js$/, '.d.mts'))
  await compileDeclarations(buildCoreDir, pkg.sourceEntry, outDtsPath)
  log.debug('packager:ts', `✓ Compiled ${pkg.name}`)

  const srcDir = join(coreDir, 'src')
  copyExistingDeclarations(srcDir, packageDir, coreDir)

  const typesPath = `./${pkg.outFile.replace(/\.m?js$/, '.d.mts')}`
  updatePackageTypes(packageDir, typesPath)

  log.debug('packager:ts', `✓ ${pkg.name} ready`)
}
