/**
 * Patterns module — box pattern system.
 *
 * Collects system patterns (container, r) and user patterns (extendPattern),
 * merges them, and renders via Liquid templates.
 *
 * Setup mirrors config: systemPatterns (internal) and userPatterns (user code).
 * Config hooks in with a one-liner to get pattern fragments.
 */

import { collectPatterns } from './collect'
import { renderBoxPattern } from './render'
import type {
  GetPatternFragmentsForConfigOptions,
  PatternPipelineResult,
  RunPatternPipelineOptions,
} from './types'

export { collectSystemPatterns, collectUserPatterns, collectPatterns } from './collect'
export { renderBoxPattern } from './render'
export { loadPatternTemplates } from './liquid'
export type { BoxPatternExtension } from '../collectors/extendPattern'
export type { CollectedPatterns, CollectPatternsOptions } from './collect'
export type { RenderBoxPatternOptions } from './render'
export type {
  RunPatternPipelineOptions,
  PatternPipelineResult,
  GetPatternFragmentsForConfigOptions,
} from './types'

/**
 * Run the pattern pipeline: collect system + optional user patterns,
 * merge, render via Liquid template.
 *
 * @example
 * // Build time (system only)
 * const { fragment } = await runPatternPipeline({
 *   cwd: CLI_ROOT,
 *   tempDir: join(CLI_ROOT, 'src/system/internal/.tmp'),
 * })
 *
 * // Runtime (system + user)
 * const { fragment } = await runPatternPipeline({
 *   cwd,
 *   includeUser: true,
 *   userInclude: config.include,
 *   tempDir: join(outDir, '.tmp'),
 * })
 */
export async function runPatternPipeline(
  options: RunPatternPipelineOptions
): Promise<PatternPipelineResult> {
  const { cwd, tempDir, cliRoot, includeUser = false, userInclude = [] } = options

  const { system, user, merged } = await collectPatterns({
    cwd,
    cliRoot,
    includeUser,
    userInclude,
    tempDir,
  })

  const fragment = await renderBoxPattern({ extensions: merged })

  return {
    fragment,
    systemCount: system.length,
    userCount: user.length,
  }
}

/**
 * Get pattern fragments for config generation. One-liner for runConfig.
 * When user has extendPattern calls, runs full pipeline (system + user) and returns merged fragment.
 * Otherwise returns undefined — config uses internal-fragments as-is (box pattern from build).
 */
export async function getPatternFragmentsForConfig(
  options: GetPatternFragmentsForConfigOptions
): Promise<string | undefined> {
  const { cwd, cliDir, userInclude, tempDir } = options

  const { fragment, userCount } = await runPatternPipeline({
    cwd,
    tempDir,
    includeUser: true,
    userInclude,
    cliRoot: cliDir,
  })

  // Only return merged fragment when user has extendPattern — otherwise internal-fragments (from build) has the box pattern
  if (userCount === 0) return undefined
  return fragment || undefined
}
