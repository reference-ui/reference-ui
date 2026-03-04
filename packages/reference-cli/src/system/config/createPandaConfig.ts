import { Liquid } from 'liquidjs'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { bundleFragments } from '../../lib/fragments'
import type { FragmentCollector } from '../../lib/fragments'
import { baseConfig } from './base'
import { loadTemplates } from './liquid'

const engine = new Liquid()

export interface CreatePandaConfigOptions {
  /** Absolute path to write the final panda.config.ts */
  outputPath: string
  /** Absolute paths to source files that call fragment functions (from scanForFragments) */
  fragmentFiles: string[]
  /** Collectors whose globalThis slots will be initialised in the output file */
  collectors: FragmentCollector[]
  /** Base config to merge with fragments. Defaults to baseConfig from ./base */
  baseConfig?: Record<string, unknown>
}

export async function createPandaConfig(
  options: CreatePandaConfigOptions
): Promise<void> {
  const {
    outputPath,
    fragmentFiles,
    collectors,
    baseConfig: baseConfigOverride,
  } = options

  const base = baseConfigOverride ?? baseConfig
  const templates = loadTemplates()

  const bundles = await bundleFragments({ files: fragmentFiles })
  const collectorKeys = collectors.map(c => `'${c.config.globalKey}'`).join(', ')

  const rendered = await engine.parseAndRender(templates.panda, {
    baseConfig: JSON.stringify(base),
    collectorSetups: collectors.map(c => c.toScript()).join('\n'),
    bundles: bundles.map(({ bundle }) => `;${bundle}`).join('\n'),
    deepMergePartial: templates.deepMerge,
    collectorKeys,
  })

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, rendered, 'utf-8')
}
