/**
 * Native Node-API ABI bindings and invocation helpers for atomic style compilation.
 * Defines exported symbol manifests and interfaces for raw compile requests.
 * Serializes virtual file configurations into JSON strings for the Rust engine.
 * Deserializes compiler output containing generated stylesheets, runtime maps, and diagnostics.
 */
import { callNativeJson } from '../../runtime/js/native'
import type { CompileResult, ReleaseScanResponse, ScanResponse } from './types'

export const ATOMIC_NATIVE_EXPORTS = ['compileSystem', 'scanSystem', 'releaseScan'] as const

export interface AtomicNative {
  compileSystem(requestJson: string): string
  scanSystem(requestJson: string): string
  releaseScan(requestJson: string): string
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

/**
 * Native single-read scan: the engine reads the enumerated paths once,
 * needle-gates, and retains the compile set behind a token. Hits return for
 * the TS match confirm; retention never crosses back until compile drains it.
 */
export function scanSystem(requestJson: string): ScanResponse {
  return callNativeJson<ScanResponse, AtomicNative>(
    'scan atomic',
    native => native.scanSystem(requestJson)
  )
}

/**
 * Release a live scan retention without draining. Error-path-only: the sync
 * `finally` between scan and compile; never on the happy path.
 */
export function releaseScan(requestJson: string): ReleaseScanResponse {
  return callNativeJson<ReleaseScanResponse, AtomicNative>(
    'release atomic scan',
    native => native.releaseScan(requestJson)
  )
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
