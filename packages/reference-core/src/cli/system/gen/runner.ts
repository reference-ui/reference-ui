import { existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cssgen, generate, loadConfigAndCreateContext } from '@pandacss/node'
import { log } from '../../lib/log'

const __dirname = dirname(fileURLToPath(import.meta.url))

export interface PandaOptions {
  watch?: boolean
}

/**
 * Run Panda full pipeline: codegen (TS utilities) + CSS extraction.
 * Needed when config changes (new tokens, recipes, patterns).
 */
export async function runPandaCodegen(
  cwd: string,
  options: PandaOptions = {}
): Promise<void> {
  const configPath = resolve(cwd, 'panda.config.ts')

  if (!existsSync(configPath)) {
    throw new Error(`panda.config.ts not found at ${configPath}. Run createPandaConfig first.`)
  }

  log.debug('system:gen', options.watch ? 'Starting Panda (watch)...' : 'Starting Panda...')

  await generate(
    options.watch ? { watch: true, poll: true, cwd } : { cwd },
    configPath
  )

  if (options.watch) {
    process.on('SIGINT', () => process.exit(0))
    process.on('SIGTERM', () => process.exit(0))
  }
}

/**
 * Run Panda cssgen only: parse files + write styles.css. Skips codegen.
 * Faster for style-only changes (e.g. css() with new color). Use when config unchanged.
 */
export async function runPandaCssGen(cwd: string): Promise<void> {
  const configPath = resolve(cwd, 'panda.config.ts')
  if (!existsSync(configPath)) {
    throw new Error(`panda.config.ts not found at ${configPath}. Run createPandaConfig first.`)
  }

  log.debug('system:gen', 'Panda cssgen (style-only)')
  const ctx = await loadConfigAndCreateContext({ config: { cwd }, configPath })
  await cssgen(ctx, { cwd })
}

export function hashPandaConfig(cwd: string): string {
  const configPath = resolve(cwd, 'panda.config.ts')
  if (!existsSync(configPath)) return ''
  return createHash('sha256').update(readFileSync(configPath, 'utf-8')).digest('hex')
}
