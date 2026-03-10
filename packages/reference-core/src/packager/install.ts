import { resolve } from 'node:path'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { log } from '../lib/log'
import { getOutDirPath } from '../lib/paths'
import { getConfig } from '../config'
import { getShortName, type PackageDefinition } from './package'
import { bundlePackage } from './bundler'
import { createSymlink } from './symlink'

const REACT_PACKAGE_NAME = '@reference-ui/react'
const LAYER_NAME_PLACEHOLDER = '__REFERENCE_UI_LAYER_NAME__'

/**
 * Install a single package to outDir (e.g., .reference-ui/react/) and symlink into node_modules.
 * For the react package, replaces the layer-name placeholder in the bundle with config.name.
 */
export async function installPackage(
  coreDir: string,
  outDir: string,
  nodeModulesScope: string,
  pkg: PackageDefinition
): Promise<void> {
  const shortName = getShortName(pkg.name)
  const targetDir = resolve(outDir, shortName)
  const linkPath = resolve(nodeModulesScope, shortName)

  mkdirSync(outDir, { recursive: true })
  mkdirSync(nodeModulesScope, { recursive: true })

  await bundlePackage({ coreDir, outDir, targetDir, pkg })

  if (pkg.name === REACT_PACKAGE_NAME) {
    const config = getConfig()
    const layerName = config?.name ?? ''
    const mainFile = pkg.main?.replace('./', '') || 'index.js'
    const bundlePath = resolve(targetDir, mainFile)
    try {
      let content = readFileSync(bundlePath, 'utf-8')
      if (content.includes(LAYER_NAME_PLACEHOLDER)) {
        content = content.replaceAll(LAYER_NAME_PLACEHOLDER, layerName)
        writeFileSync(bundlePath, content, 'utf-8')
      }
    } catch (err) {
      log.debug('packager', `Could not inject layer name into react bundle: ${err}`)
    }
  }

  createSymlink(targetDir, linkPath)

  log.debug('packager', `✓ ${pkg.name} → ${linkPath}`)
}

/**
 * Install all packages to outDir (.reference-ui/) and symlink node_modules/@reference-ui/* → .reference-ui/*.
 * Enables module resolution for @reference-ui/react, @reference-ui/styled, @reference-ui/system.
 */
export async function installPackages(
  coreDir: string,
  userProjectDir: string,
  packages: PackageDefinition[]
): Promise<void> {
  const outDir = getOutDirPath(userProjectDir)
  const nodeModulesScope = resolve(userProjectDir, 'node_modules', '@reference-ui')

  for (const pkg of packages) {
    await installPackage(coreDir, outDir, nodeModulesScope, pkg)
  }
}
