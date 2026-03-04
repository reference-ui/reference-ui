import { Liquid } from 'liquidjs'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { bundleFragments } from '../../lib/fragments'
import type { FragmentCollector } from '../../lib/fragments'
import { deepMergeFnLines } from './utils/deepMerge'
import pandaConfigTemplate from './templates/panda.config.liquid'

const engine = new Liquid()

export interface CreatePandaConfigOptions {
  /** Absolute path to write the final panda.config.ts */
  outputPath: string
  /** Absolute paths to source files that call fragment functions (from scanForFragments) */
  fragmentFiles: string[]
  /** Collectors whose globalThis slots will be initialised in the output file */
  collectors: FragmentCollector[]
}

export async function createPandaConfig(
  options: CreatePandaConfigOptions
): Promise<void> {
  const { outputPath, fragmentFiles, collectors } = options

  const bundles = await bundleFragments({ files: fragmentFiles })
  const collectorKeys = collectors.map(c => `'${c.config.globalKey}'`).join(', ')

  const rendered = await engine.parseAndRender(pandaConfigTemplate as string, {
    collectorSetups: collectors.map(c => c.toScript()).join('\n'),
    bundles: bundles.map(({ bundle }) => `;${bundle}`).join('\n'),
    deepMergeFn: deepMergeFnLines.join('\n'),
    collectorKeys,
  })

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, rendered, 'utf-8')
}
