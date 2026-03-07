import { Liquid } from 'liquidjs'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { bundleFragments } from '../../../lib/fragments'
import type { FragmentCollector } from '../../../lib/fragments'
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
  /** Pre-bundled internal fragments (from CLI build). Injected before user fragments. */
  internalFragments?: string
  /** Alias module ids to paths when bundling fragment files (e.g. @reference-ui/system → CLI entry). */
  fragmentBundleAlias?: Record<string, string>
}

export async function createPandaConfig(
  options: CreatePandaConfigOptions
): Promise<void> {
  const {
    outputPath,
    fragmentFiles,
    collectors,
    baseConfig: baseConfigOverride,
    internalFragments,
    fragmentBundleAlias,
  } = options

  const base = baseConfigOverride ?? baseConfig
  const templates = loadTemplates()

  const userFragments = (
    await bundleFragments({
      files: fragmentFiles,
      ...(fragmentBundleAlias && { alias: fragmentBundleAlias }),
    })
  )
    .map(({ bundle }) => `;${bundle}`)
    .join('\n')
  const bundles = [internalFragments, userFragments].filter(Boolean).join('\n')

  const collectorGetters = collectors.map(c => c.toGetter()).join(', ')

  const rendered = await engine.parseAndRender(templates.panda, {
    baseConfig: JSON.stringify(base),
    collectorSetups: collectors.map(c => c.toScript()).join('\n'),
    bundles,
    deepMergePartial: templates.deepMerge,
    collectorGetters,
  })

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, rendered, 'utf-8')
}
