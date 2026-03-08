import { existsSync, mkdirSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { generate as pandaGenerate, cssgen as pandaCssgen, loadConfigAndCreateContext } from '@pandacss/node'
import { getConfig, getCwd } from '../../../config/store'
import { getOutDirPath, resolveCliPackageDir } from '../../../lib/paths'
import { log } from '../../../lib/log'
import { updateBaseSystemCss } from '../../base/create'
import { applyLayerPostprocess } from '../../layers/applyLayerPostprocess'

/**
 * Ensure outDir has node_modules/@pandacss so panda.config.ts can resolve '@pandacss/dev'
 * when loaded by @pandacss/node (config is in outDir; user project may not have Panda).
 * Same idea as reference-core using coreDir for cwd — we make outDir resolvable via symlink.
 */
function ensurePandaResolvableFromOutDir(userCwd: string, outDir: string): void {
  const cliDir = resolveCliPackageDir(userCwd)
  const cliPandacss = join(cliDir, 'node_modules', '@pandacss')
  const outNodeModules = join(outDir, 'node_modules')
  const outPandacss = join(outNodeModules, '@pandacss')
  if (!existsSync(cliPandacss)) return
  if (existsSync(outPandacss)) return
  mkdirSync(outNodeModules, { recursive: true })
  symlinkSync(cliPandacss, outPandacss)
}

/**
 * Run Panda full pipeline via @pandacss/node (same pattern as reference-core gen/code.ts).
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
 * Run Panda cssgen only via @pandacss/node (same pattern as reference-core gen/css.ts).
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
