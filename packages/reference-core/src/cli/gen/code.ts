import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { generate } from '@pandacss/node'
import { emit } from '../event-bus'
import { log } from '../lib/log'
import { debounce } from '../lib/debounce'

/**
 * Run Panda full pipeline: codegen (TS utilities) + CSS extraction.
 * Emits system:compiled (build ready; packager does full install including styles).
 */
export async function runCodegen(cwd: string): Promise<void> {
  const configPath = resolve(cwd, 'panda.config.ts')
  if (!existsSync(configPath)) {
    throw new Error(`panda.config.ts not found at ${configPath}. Run createPandaConfig first.`)
  }
  log.debug('gen:code', 'Starting Panda...')
  await generate({ cwd }, configPath)
  emit('gen:complete', {})
  emit('system:compiled', {})
}

/** Returns a debounced handler for config:ready. Call on each config:ready. */
export function onConfigReady(cwd: string): () => void {
  return debounce(
    () => runCodegen(cwd).catch(e => log.error('[gen:code] failed:', e)),
    150
  )
}
