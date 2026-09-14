/**
 * Native Node-API ABI bindings and invocation helpers for Atlas codebase analysis.
 * Defines exported symbol manifests and interfaces for raw native analyzer calls.
 * Translates project paths and scanner configurations into serialized payloads for the Rust addon.
 * Deserializes JSON responses into structured component hierarchies and diagnostic models.
 */
import { callNativeJson } from '../../runtime/js/native'
import type { AtlasAnalysisResult } from './types'

export const ATLAS_NATIVE_EXPORTS = ['analyzeAtlas'] as const

export interface AtlasNative {
  analyzeAtlas(rootDir: string, configJson?: string): string
}

export function analyzeDetailed(rootDir: string, configJson?: string): AtlasAnalysisResult {
  return callNativeJson<AtlasAnalysisResult, AtlasNative>('analyze Atlas data', (native) =>
    native.analyzeAtlas(rootDir, configJson)
  )
}
