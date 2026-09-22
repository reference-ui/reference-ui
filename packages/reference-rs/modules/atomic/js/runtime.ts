/**
 * Native Node-API ABI bindings and invocation helpers for atomic style compilation.
 * Defines exported symbol manifests and interfaces for raw compile requests.
 * Serializes virtual file configurations into JSON strings for the Rust engine.
 * Deserializes compiler output containing generated stylesheets, runtime maps, and diagnostics.
 */
import { callNativeJson } from '../../runtime/js/native'
import type { CompileResult } from './types'

export const ATOMIC_NATIVE_EXPORTS = ['compileSystem'] as const

export interface AtomicNative {
  compileSystem(requestJson: string): string
}

/**
 * Slim-wire refold of the portable sheet: the divergent head plus the shared
 * tail's UTF-16 length. Present only on the slim path; the proof channel
 * still ships the full `portableStylesheet`.
 */
interface SlimWireRefold {
  portableHead: string
  sharedTailUtf16: number
}

export function compileSystem(requestJson: string): CompileResult {
  const parsed = callNativeJson<CompileResult & Partial<SlimWireRefold>, AtomicNative>(
    'compile atomic',
    native => native.compileSystem(requestJson)
  )
  if (
    parsed.portableStylesheet === undefined &&
    typeof parsed.portableHead === 'string' &&
    typeof parsed.sharedTailUtf16 === 'number'
  ) {
    const { portableHead, sharedTailUtf16, stylesheet, ...tail } = parsed
    const portableStylesheet =
      portableHead + stylesheet.slice(stylesheet.length - sharedTailUtf16)
    return { stylesheet, portableStylesheet, ...tail }
  }
  return parsed
}
