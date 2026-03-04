import ejs from 'ejs'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { bundleFragments } from '../../lib/fragments'
import type { FragmentCollector } from '../../lib/fragments'
// @ts-expect-error — .ejs loaded as text by tsup
import pandaConfigTemplate from './templates/panda.config.ejs'
// @ts-expect-error — .ejs loaded as text by tsup
import deepMergeJs from './utils/deepMerge.ejs'

// eslint-disable-next-line sonarjs/dynamically-constructed-templates -- safe: controlled EJS template
const template = ejs.compile(pandaConfigTemplate as string, { strict: true })

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

  const rendered = template({
    collectorSetups: collectors.map(c => c.toScript()),
    bundles: bundles.map(b => b.bundle),
    collectorKeys: collectors.map(c => `'${c.config.globalKey}'`).join(', '),
    deepMerge: deepMergeJs,
  })

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, rendered, 'utf-8')
}
