import ejs from 'ejs'
import { writeFileSync } from 'node:fs'
import type { ReferenceUIConfig } from '../../config/types'
// @ts-expect-error — .ejs loaded as text by tsup
import pandaConfigTemplate from './templates/panda.config.ejs'

// eslint-disable-next-line sonarjs/dynamically-constructed-templates -- safe: controlled EJS template
const template = ejs.compile(pandaConfigTemplate as string, { strict: true })

export interface PandaConfigFragment {
  /** Import binding name, e.g. cfg0, cfg1 */
  name: string
  /** Relative path for the import statement */
  path: string
}

export interface CreatePandaConfigOptions {
  /** Absolute path to write the generated entry file (becomes panda.config.ts after bundling) */
  outputPath: string
  /** Discovered fragment files from eval scanner */
  fragments: PandaConfigFragment[]
  /** Relative path to initCollector (sets up globalThis[COLLECTOR_KEY]) */
  initCollectorPath: string
  /** Relative path to extendPandaConfig (exports COLLECTOR_KEY) */
  collectorPath: string
  /** Relative path to deepMerge util */
  deepMergePath: string
  /** Upstream baseSystems from ui.config.extends */
  upstream?: ReferenceUIConfig['extends']
}

/**
 * Render the panda.config entry file from the EJS template.
 * The output is a TypeScript file that imports all fragments, merges them,
 * and exports defineConfig(config). It is then bundled by esbuild to produce
 * the final panda.config.ts.
 */
export function createPandaConfig(options: CreatePandaConfigOptions): void {
  const { outputPath, fragments, initCollectorPath, collectorPath, deepMergePath, upstream = [] } = options

  const rendered = template({
    fragments,
    initCollectorPath,
    collectorPath,
    deepMergePath,
    upstream,
    upstreamJson: JSON.stringify(upstream),
  })

  writeFileSync(outputPath, rendered, 'utf-8')
}
