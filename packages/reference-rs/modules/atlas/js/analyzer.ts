/**
 * Project analysis engine integrating Atlas extraction with native Rust processing.
 * Accepts repository root paths and optional scanner configurations.
 * Ingests source files and produces aggregated component usage metrics and diagnostic reports.
 * Emits typed analysis models for architectural governance and design system audits.
 */
import path from 'node:path'

import { callNativeJson } from '../../../runtime/native'
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
  const configJson = config ? JSON.stringify({ ...config, rootDir: normalizedRoot }) : undefined

  return callNativeJson<AtlasAnalysisResult>('analyze Atlas data', (native) =>
    native.analyzeAtlas(normalizedRoot, configJson)
  )
}
