import { createRequire } from 'node:module'
import { existsSync, lstatSync, mkdirSync, readlinkSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, parse, resolve } from 'node:path'
import { generate as pandaGenerate, cssgen as pandaCssgen, loadConfigAndCreateContext } from '@pandacss/node'
import { getConfig, getCwd } from '../../../config/store'
import { getOutDirPath } from '../../../lib/paths'
import { emitLog, log } from '../../../lib/log'
import { updateBaseSystemCss } from '../../base/create'
import { PANDA_GLOBAL_CSS_FILENAME, postprocessCss } from '../../stylesheet/postprocess'

const WORKSPACE_MARKERS = ['pnpm-workspace.yaml', 'nx.json'] as const
const CORE_PANDACSS_PATH = ['packages', 'reference-core', 'node_modules', '@pandacss'] as const

function findWorkspaceRoot(startDir: string): string | null {
  let dir = startDir
  const root = parse(dir).root

  while (dir !== root) {
    if (WORKSPACE_MARKERS.some((marker) => existsSync(resolve(dir, marker)))) {
      return dir
    }
    dir = dirname(dir)
  }

  return null
}

function resolveWorkspaceCorePandacss(userCwd: string): string | null {
  const workspaceRoot = findWorkspaceRoot(userCwd)
  if (!workspaceRoot) return null

  const workspaceCorePandacss = resolve(workspaceRoot, ...CORE_PANDACSS_PATH)
  return existsSync(workspaceCorePandacss) ? workspaceCorePandacss : null
}

function resolveInstalledPandacss(): string {
  const req = createRequire(import.meta.url)
  const pandaDevPkg = req.resolve('@pandacss/dev/package.json')
  return dirname(dirname(pandaDevPkg))
}

function resolveCorePandacssPath(userCwd: string): string {
  return resolveWorkspaceCorePandacss(userCwd) ?? resolveInstalledPandacss()
}

function removeExistingPandacssLink(outPandacss: string, corePandacss: string): boolean {
  try {
    const stats = lstatSync(outPandacss)
    if (stats.isSymbolicLink() && readlinkSync(outPandacss) === corePandacss) {
      return true
    }
    if (stats.isSymbolicLink()) {
      unlinkSync(outPandacss)
    } else {
      rmSync(outPandacss, { recursive: true, force: true })
    }
  } catch {
    // No existing entry to replace.
  }

  return false
}

function ensurePandacssLink(outDir: string, corePandacss: string): void {
  const outNodeModules = join(outDir, 'node_modules')
  const outPandacss = join(outNodeModules, '@pandacss')

  if (removeExistingPandacssLink(outPandacss, corePandacss)) return

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
 * Ensure outDir has node_modules/@pandacss so panda.config.ts can resolve '@pandacss/dev'
 * when loaded by @pandacss/node (config is in outDir; user project may not have Panda).
 * We make outDir resolvable via symlink so Panda can load from generated config safely.
 */
function ensurePandaResolvableFromOutDir(userCwd: string, outDir: string): void {
  const corePandacss = resolveCorePandacssPath(userCwd)
  if (!existsSync(corePandacss)) return

  ensurePandacssLink(outDir, corePandacss)
}

class PandaRunError extends Error {
  readonly pandaOutput: string
  readonly cause: unknown

  constructor(cause: unknown, pandaOutput: string) {
    const message = cause instanceof Error ? cause.message : String(cause)
    super(message)
    this.name = 'PandaRunError'
    this.pandaOutput = pandaOutput
    this.cause = cause
  }
}

function getPandaErrorOutput(error: unknown): string | undefined {
  return error instanceof PandaRunError && error.pandaOutput.length > 0
    ? error.pandaOutput
    : undefined
}

function unwrapPandaError(error: unknown): unknown {
  return error instanceof PandaRunError ? error.cause : error
}

export { getPandaErrorOutput, unwrapPandaError }

async function runWithSuppressedPandaLogs<T>(run: () => Promise<T>): Promise<T> {
  const originalLog = console.log
  const originalInfo = console.info
  const originalWarn = console.warn
  const captured: string[] = []

  const capture = (...args: unknown[]) => {
    captured.push(
      args
        .map(arg => (typeof arg === 'string' ? arg : String(arg)))
        .join(' ')
    )
  }

  console.log = capture
  console.info = capture
  console.warn = capture

  try {
    return await run()
  } catch (error) {
    throw new PandaRunError(error, captured.join('\n').trim())
  } finally {
    console.log = originalLog
    console.info = originalInfo
    console.warn = originalWarn
  }
}

function isNativeSystemEngine(): boolean {
  return process.env.REF_SYSTEM_ENGINE === 'native'
}

async function writeNativeStylesheet(outDir: string, cwd: string): Promise<void> {
  const { compileSync } = await import('@reference-ui/rust/system')
  const virtualDir = join(outDir, 'virtual')
  const targetDir = existsSync(virtualDir) ? virtualDir : cwd
  const start = performance.now()
  const nativeResult = compileSync({ rootDir: targetDir })
  const elapsed = (performance.now() - start).toFixed(1)
  const stylesheet = nativeResult?.stylesheet
  if (typeof stylesheet !== 'string') {
    throw new Error('Native system compiler produced no stylesheet')
  }

  const styledDir = join(outDir, 'styled')
  mkdirSync(styledDir, { recursive: true })
  writeFileSync(join(styledDir, 'styles.css'), stylesheet, 'utf-8')
  emitLog(
    'info',
    [`Compiled native CSS with reference-rs in ${elapsed}ms (${nativeResult.wants?.length ?? 0} style wants)`],
    { badge: 'ref', module: 'sync' }
  )
}

async function emitCssAndPostprocess(
  outDir: string,
  cwd: string,
  ctx: Awaited<ReturnType<typeof loadConfigAndCreateContext>>,
): Promise<void> {
  const runGlobalCssgen = () =>
    pandaCssgen(ctx, {
      cwd: outDir,
      type: 'global',
      outfile: join(outDir, 'styled', PANDA_GLOBAL_CSS_FILENAME),
    })

  if (isNativeSystemEngine()) {
    await runWithSuppressedPandaLogs(runGlobalCssgen)
    log.debug('panda', 'cssgen done', outDir)
    await writeNativeStylesheet(outDir, cwd)
    return
  }

  await runWithSuppressedPandaLogs(() => pandaCssgen(ctx, { cwd: outDir }))
  await runWithSuppressedPandaLogs(runGlobalCssgen)
  log.debug('panda', 'cssgen done', outDir)

  const config = getConfig()
  if (config && cwd) {
    const layerCss = postprocessCss(outDir, config)
    if (layerCss) updateBaseSystemCss(cwd, layerCss)
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
  await runWithSuppressedPandaLogs(() => pandaGenerate({ cwd: outDir }, configPath))
  log.debug('panda', 'codegen done', outDir)

  const ctx = await loadConfigAndCreateContext({ config: { cwd: outDir }, configPath })
  await emitCssAndPostprocess(outDir, cwd, ctx)
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
  await emitCssAndPostprocess(outDir, cwd, ctx)
}
