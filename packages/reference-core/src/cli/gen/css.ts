import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { cssgen, loadConfigAndCreateContext } from '@pandacss/node'
import { emit } from '../event-bus'
import { log } from '../lib/log'

/**
 * Run Panda cssgen only: parse files + write styles.css. Skips codegen.
 * Emits panda:css:compiled when done (hot path – packager copies styles).
 * Handles its own errors (logs, does not rethrow).
 */
export function runCss(cwd: string): void {
  runCssAsync(cwd).catch(e => log.error('[gen:css] failed:', e))
}

async function runCssAsync(cwd: string): Promise<void> {
  const configPath = resolve(cwd, 'panda.config.ts')
  if (!existsSync(configPath)) {
    throw new Error(`panda.config.ts not found at ${configPath}. Run createPandaConfig first.`)
  }
  log.debug('gen:css', 'Panda cssgen')
  const ctx = await loadConfigAndCreateContext({ config: { cwd }, configPath })
  await cssgen(ctx, { cwd })
  emit('panda:css:compiled', {})
}
