/**
 * Shared Node-API native invocation layer for Reference UI modules.
 * Resolves the platform-specific native addon binding and provides fail-safe execution helpers.
 * Handles JSON serialization and parsing boundaries between TypeScript wrappers and the Rust core.
 * Ensures consistent diagnostic error reporting when native features are invoked across environments.
 */
import { getReferenceNative, getReferenceNativeUnavailableMessage } from './loader'
import type { ReferenceNativeBinding } from './loader'

export type { ReferenceNativeBinding } from './loader'

export function requireNative<N = ReferenceNativeBinding>(feature: string): N {
  const native = getReferenceNative()
  if (!native) {
    throw new Error(getReferenceNativeUnavailableMessage(feature))
  }

  return native as unknown as N
}

export function callNativeJson<T, N = ReferenceNativeBinding>(
  feature: string,
  run: (n: N) => string
): T {
  const native = requireNative<N>(feature)
  const resultJson = run(native)
  return JSON.parse(resultJson) as T
}
