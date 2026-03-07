import { Liquid } from 'liquidjs'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { CollectorBundleCollection } from '../../../lib/fragments'
import { baseConfig } from './base'
import { loadTemplates } from './liquid'

const engine = new Liquid()

export interface CreatePandaConfigOptions {
  /** Absolute path to write the final panda.config.ts */
  outputPath: string
  /** Prepared collector runtime with bundled fragment files and value getters. */
  collectorBundle: CollectorBundleCollection
  /** Base config. Defaults to baseConfig from ./base */
  baseConfig?: Record<string, unknown>
}

/**
 * Write panda.config.ts using a prepared collector bundle.
 * The generated file initialises collectors, exposes runtime fragment functions,
 * runs the bundled fragment IIFEs, then reads the collected token values into defineConfig().
 */
export async function createPandaConfig(options: CreatePandaConfigOptions): Promise<void> {
  const {
    outputPath,
    collectorBundle,
    baseConfig: baseOverride,
  } = options

  const base = (baseOverride ?? baseConfig) as Record<string, unknown>
  const templates = loadTemplates()
  const tokensValue = collectorBundle.getValue('tokens')

  // Valid JS object literal for baseConfig (inserted raw in template)
  const baseConfigLiteral = JSON.stringify(base, null, 2)

  const rendered = await engine.parseAndRender(templates.panda, {
    baseConfigLiteral,
    collectorSetups: collectorBundle.collectorSetups,
    collectorFunctions: collectorBundle.collectorFunctions,
    bundles: collectorBundle.bundles,
    tokensValue,
    deepMergePartial: templates.deepMerge,
  })

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, rendered, 'utf-8')
}
