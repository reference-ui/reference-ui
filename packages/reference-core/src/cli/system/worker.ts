import { resolveCorePackageDir } from '../lib/resolve-core'
import type { ReferenceUIConfig } from '../config'
import { runEval } from './eval'
import { createPandaConfig } from './config'
import { runPandaCodegen, runPandaCss } from './gen/runner'
import { resolve } from 'node:path'

export interface SystemWorkerPayload {
  cwd: string
  config: ReferenceUIConfig
}

export async function runSystem(payload: SystemWorkerPayload): Promise<void> {
  const { cwd, config } = payload
  const coreDir = resolveCorePackageDir()

  // Scan both core's src/styled and user's include directories
  const coreDirs = ['src/styled']
  const userDirs = config.include.map(pattern => {
    // Convert glob patterns to base directories
    // e.g., 'src/**/*.{ts,tsx}' -> 'src'
    const baseDir = pattern.split('**')[0].replace(/\/+$/, '')
    return resolve(cwd, baseDir)
  })

  // Eval is used to detect extension calls; only rebuild config if needed.
  const fragments = await runEval(coreDir, [...coreDirs, ...userDirs], ['panda.base.ts'])
  if (fragments.length > 0 && config.include.length > 0) {
    await createPandaConfig(coreDir, { userDirectories: userDirs })
  }

  // Generate JS/TS codegen files
  runPandaCodegen(coreDir)

  // Generate CSS with tokens layer
  runPandaCss(coreDir)
}

export default runSystem
