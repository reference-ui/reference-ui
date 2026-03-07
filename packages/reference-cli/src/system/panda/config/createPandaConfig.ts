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
  /** Absolute paths to source files that call tokens() (from scanForFragments). */
  fragmentFiles: string[]
  /** Tokens collector — its globalThis slot is initialised and read in the generated file. */
  collector: FragmentCollector
  /** Base config. Defaults to baseConfig from ./base */
  baseConfig?: Record<string, unknown>
  /** Pre-bundled internal fragments (e.g. from CLI build). Injected before user bundles. */
  internalFragments?: string
  /** Alias for bundling fragment files (e.g. @reference-ui/system → CLI entry). */
  fragmentBundleAlias?: Record<string, string>
}

/**
 * Write panda.config.ts using the tokens collector and injected fragment bundles.
 * The generated file: inits the collector, defines tokens(), runs the bundled fragment IIFEs
 * (so they call tokens()), then reads the collector, merges token fragments, and defineConfig().
 */
export async function createPandaConfig(options: CreatePandaConfigOptions): Promise<void> {
  const {
    outputPath,
    fragmentFiles,
    collector,
    baseConfig: baseOverride,
    internalFragments,
    fragmentBundleAlias,
  } = options

  const base = (baseOverride ?? baseConfig) as Record<string, unknown>
  const templates = loadTemplates()

  const userBundles =
    fragmentFiles.length > 0
      ? (
          await bundleFragments({
            files: fragmentFiles,
            ...(fragmentBundleAlias && { alias: fragmentBundleAlias }),
          })
        )
          .map(({ bundle }) => `;${bundle}`)
          .join('\n')
      : ''

  const bundles = [internalFragments, userBundles].filter(Boolean).join('\n')

  // Valid JS object literal for baseConfig (inserted raw in template)
  const baseConfigLiteral = JSON.stringify(base, null, 2)
  const collectorSetups = collector.toScript()

  const rendered = await engine.parseAndRender(templates.panda, {
    baseConfigLiteral,
    collectorSetups,
    bundles,
    deepMergePartial: templates.deepMerge,
  })

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, rendered, 'utf-8')
}
