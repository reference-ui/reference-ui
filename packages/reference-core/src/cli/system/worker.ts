import { resolveCorePackageDir } from '../lib/resolve-core'
import type { ReferenceUIConfig } from '../config'
import { runEval } from './eval'
import { createPandaConfig } from './config'
import { runPandaCodegen, runPandaCss } from './gen/runner'

export interface SystemWorkerPayload {
  config: ReferenceUIConfig
}

export async function runSystem(payload: SystemWorkerPayload): Promise<void> {
  const { config } = payload
  const coreDir = resolveCorePackageDir()

  // Eval is used to detect extension calls; only rebuild config if needed.
  const fragments = await runEval(coreDir, ['src/styled'], ['panda.base.ts'])
  if (fragments.length > 0 && config.include.length > 0) {
    await createPandaConfig(coreDir)
  }

  // Generate JS/TS codegen files
  runPandaCodegen(coreDir)

  // Generate CSS with tokens layer
  runPandaCss(coreDir)
}

export default runSystem
