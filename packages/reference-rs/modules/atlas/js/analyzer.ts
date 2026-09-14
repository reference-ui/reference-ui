import path from 'node:path'

import { analyzeAtlas } from '../../../runtime'
import type { AtlasAnalysisResult, AtlasConfig, Component } from './types'

export async function analyze(
  rootDir: string,
  config?: AtlasConfig
): Promise<Component[]> {
  return (await analyzeDetailed(rootDir, config)).components
}

export async function analyzeDetailed(
  rootDir: string,
  config?: AtlasConfig
): Promise<AtlasAnalysisResult> {
  const normalizedRoot = path.resolve(rootDir)
  const configJson = config ? JSON.stringify({ ...config, rootDir: normalizedRoot }) : undefined
  return JSON.parse(analyzeAtlas(normalizedRoot, configJson)) as AtlasAnalysisResult
}
