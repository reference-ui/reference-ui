import path from 'node:path'

import { analyzeAtlas } from '../runtime'
import type { AtlasAnalysisResult, AtlasConfig, Component } from './types'

/**
 * Analyze a project and return Atlas components only.
 *
 * Use `analyzeDetailed()` when the caller also needs diagnostics.
 */
export async function analyze(
  rootDir: string,
  config?: AtlasConfig
): Promise<Component[]> {
  return (await analyzeDetailed(rootDir, config)).components
}

/**
 * Analyze a project and return both components and diagnostics.
 *
 * This is the recommended integration point for build steps and golden-output
 * generation because it preserves partial results instead of forcing callers to
 * infer failure modes from missing components.
 */
export async function analyzeDetailed(
  rootDir: string,
  config?: AtlasConfig
): Promise<AtlasAnalysisResult> {
  const normalizedRoot = path.resolve(rootDir)
  return JSON.parse(
    analyzeAtlas(
      normalizedRoot,
      config ? JSON.stringify({ ...config, rootDir: normalizedRoot }) : undefined
    )
  ) as AtlasAnalysisResult
}
