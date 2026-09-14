/**
 * Shared Node-API native invocation layer for Reference UI modules.
 * Resolves the platform-specific native addon binding and provides fail-safe execution helpers.
 * Handles JSON serialization and parsing boundaries between TypeScript wrappers and the Rust core.
 * Ensures consistent diagnostic error reporting when native features are invoked across environments.
 */
import { getVirtualNative, getVirtualNativeUnavailableMessage } from './loader'
import type { VirtualNativeBinding } from './loader'

export type { VirtualNativeBinding } from './loader'

export function requireNative(feature: string): VirtualNativeBinding {
  const native = getVirtualNative()
  if (!native) {
    throw new Error(getVirtualNativeUnavailableMessage(feature))
  }

  return native
}

export function callNativeJson<T>(feature: string, run: (n: VirtualNativeBinding) => string): T {
  const native = requireNative(feature)
  const resultJson = run(native)
  return JSON.parse(resultJson) as T
}
