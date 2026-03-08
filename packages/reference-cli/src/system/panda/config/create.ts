import { Liquid } from 'liquidjs'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { CollectorBundles } from '../../../lib/fragments'
import { baseConfig as defaultBaseConfig } from './base'
import { loadTemplates } from './liquid'

const engine = new Liquid()

export interface CreatePandaConfigOptions {
  /** Absolute path to write the final panda.config.ts */
  outputPath: string
  /** Prepared collector runtime with bundled fragment files and value getters. */
  collectorBundle: CollectorBundles
  /** Base config. Defaults to baseConfig from ./base */
  baseConfig?: Record<string, unknown>
  /** Relative import path from panda.config.ts to the bundled extensions runtime. */
  extensionsImportPath: string
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
    baseConfig = defaultBaseConfig,
    extensionsImportPath,
  } = options

  const templates = loadTemplates()
  const tokensValueExpression = collectorBundle.getValue('tokens')
  const keyframesValueExpression = collectorBundle.getValue('keyframes')
  const fontValueExpression = collectorBundle.getValue('font')
  const patternsValueExpression = collectorBundle.getValue('box-pattern')

  // Valid JS object literal for baseConfig (inserted raw in template)
  const baseConfigLiteral = JSON.stringify(baseConfig, null, 2)

  const rendered = await engine.parseAndRender(templates.panda, {
    collectorFragments: collectorBundle.collectorFragments,
    baseConfigLiteral,
    tokensValueExpression,
    keyframesValueExpression,
    fontValueExpression,
    patternsValueExpression,
    extensionsImportPath,
  })

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, rendered, 'utf-8')
}
