import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { getCwd } from '../../config/store'
import { getOutDirPath } from '../../lib/paths'
import { log } from '../../lib/log'

function getPandaBinPath(projectRoot: string): string {
  return join(projectRoot, 'node_modules', '.bin', 'panda')
}

/**
 * Run Panda codegen from the project's outDir so it finds panda.config.ts.
 * Writes system/styled (codegen) and style.css (cssgen).
 * Binary is resolved from project root node_modules; process cwd is outDir so config is found.
 * Uses fixed path to panda binary to satisfy sonarjs/no-os-command-from-path.
 */
export function runPandaCodegen(): void {
  const cwd = getCwd()
  if (!cwd) {
    throw new Error('runPandaCodegen: getCwd() is undefined')
  }

  const outDir = getOutDirPath(cwd)
  const pandaBin = getPandaBinPath(cwd)

  const result = spawnSync(pandaBin, ['codegen'], {
    cwd: outDir,
    stdio: 'pipe',
  })

  if (result.status !== 0) {
    const stderr = result.stderr?.toString() ?? ''
    const stdout = result.stdout?.toString() ?? ''
    log.error('panda', 'codegen failed', { status: result.status, stderr, stdout })
    throw new Error(`Panda codegen failed: ${stderr || stdout || result.status}`)
  }

  log.debug('panda', 'codegen done', outDir)
}

/**
 * Run Panda cssgen only (fast path for watch).
 * Call when run:panda:css is received.
 * Uses fixed path to panda binary to satisfy sonarjs/no-os-command-from-path.
 */
export function runPandaCss(): void {
  const cwd = getCwd()
  if (!cwd) {
    throw new Error('runPandaCss: getCwd() is undefined')
  }

  const outDir = getOutDirPath(cwd)
  const pandaBin = getPandaBinPath(cwd)

  const result = spawnSync(pandaBin, ['cssgen'], {
    cwd: outDir,
    stdio: 'pipe',
  })

  if (result.status !== 0) {
    const stderr = result.stderr?.toString() ?? ''
    const stdout = result.stdout?.toString() ?? ''
    log.error('panda', 'cssgen failed', { status: result.status, stderr, stdout })
    throw new Error(`Panda cssgen failed: ${stderr || stdout || result.status}`)
  }

  log.debug('panda', 'cssgen done', outDir)
}
