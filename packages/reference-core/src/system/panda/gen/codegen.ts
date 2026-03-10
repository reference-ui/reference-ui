import { existsSync, lstatSync, mkdirSync, readlinkSync, rmSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { generate as pandaGenerate, cssgen as pandaCssgen, loadConfigAndCreateContext } from '@pandacss/node'
import { getConfig, getCwd } from '../../../config/store'
import { getOutDirPath, resolveCorePackageDir } from '../../../lib/paths'
import { log } from '../../../lib/log'
import { updateBaseSystemCss } from '../../base/create'
import { applyLayerPostprocess } from '../../layers/applyLayerPostprocess'

/**
 * Ensure outDir has node_modules/@pandacss so panda.config.ts can resolve '@pandacss/dev'
 * when loaded by @pandacss/node (config is in outDir; user project may not have Panda).
 * We make outDir resolvable via symlink so Panda can load from generated config safely.
 */
function ensurePandaResolvableFromOutDir(userCwd: string, outDir: string): void {
  const coreDir = resolveCorePackageDir(userCwd)
  const corePandacss = join(coreDir, 'node_modules', '@pandacss')
  const outNodeModules = join(outDir, 'node_modules')
  const outPandacss = join(outNodeModules, '@pandacss')
  if (!existsSync(corePandacss)) return

  try {
    const stats = lstatSync(outPandacss)
    if (stats.isSymbolicLink() && readlinkSync(outPandacss) === corePandacss) {
      return
    }

    rmSync(outPandacss, { recursive: true, force: true })
  } catch {
    // No existing entry to replace.
  }

  mkdirSync(outNodeModules, { recursive: true })
  try {
    symlinkSync(corePandacss, outPandacss)
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'EEXIST') {
      throw error
    }
  }
}

/**
 * Run Panda full pipeline via @pandacss/node.
 * Config lives in outDir; we ensure outDir can resolve @pandacss then call generate() and cssgen().
 */
export async function runPandaCodegen(): Promise<void> {
  const cwd = getCwd()
  if (!cwd) {
    throw new Error('runPandaCodegen: getCwd() is undefined')
  }

  const outDir = getOutDirPath(cwd)
  ensurePandaResolvableFromOutDir(cwd, outDir)

  const configPath = join(outDir, 'panda.config.ts')
  if (!existsSync(configPath)) {
    throw new Error(`panda.config.ts not found at ${configPath}. Run config worker first.`)
  }

  log.debug('panda', 'codegen start', outDir)
  await pandaGenerate({ cwd: outDir }, configPath)
  log.debug('panda', 'codegen done', outDir)

  const ctx = await loadConfigAndCreateContext({ config: { cwd: outDir }, configPath })
  await pandaCssgen(ctx, { cwd: outDir })
  log.debug('panda', 'cssgen done', outDir)

  const config = getConfig()
  if (config && cwd) {
    const layerCss = applyLayerPostprocess(outDir, config)
    if (layerCss) updateBaseSystemCss(cwd, layerCss)
  }
}

/**
 * Run Panda cssgen only via @pandacss/node.
 */
export async function runPandaCss(): Promise<void> {
  const cwd = getCwd()
  if (!cwd) {
    throw new Error('runPandaCss: getCwd() is undefined')
  }

  const outDir = getOutDirPath(cwd)
  ensurePandaResolvableFromOutDir(cwd, outDir)

  const configPath = join(outDir, 'panda.config.ts')
  if (!existsSync(configPath)) {
    throw new Error(`panda.config.ts not found at ${configPath}. Run config worker first.`)
  }

  log.debug('panda', 'cssgen')
  const ctx = await loadConfigAndCreateContext({ config: { cwd: outDir }, configPath })
  await pandaCssgen(ctx, { cwd: outDir })
  log.debug('panda', 'cssgen done', outDir)

  const config = getConfig()
  if (config && cwd) {
    const layerCss = applyLayerPostprocess(outDir, config)
    if (layerCss) updateBaseSystemCss(cwd, layerCss)
  }
}
