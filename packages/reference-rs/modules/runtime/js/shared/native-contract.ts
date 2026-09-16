/**
 * Composed exports contract for the native Rust addon.
 * Combines the minimal host export requirement with product-level native export manifests.
 * Consulted during build verification, native loading sanity checks, and binary compatibility inspection.
 */
import { ATLAS_NATIVE_EXPORTS } from '../../../atlas/js/runtime'
import { STYLETRACE_NATIVE_EXPORTS } from '../../../styletrace/js/runtime'
import { ATOMIC_NATIVE_EXPORTS } from '../../../atomic/js/runtime'
import { TASTY_NATIVE_EXPORTS } from '../../../tasty/js/runtime'
import { TYPEGEN_NATIVE_EXPORTS } from '../../../typegen/js/runtime'
import { VIRTUALRS_NATIVE_EXPORTS } from '../../../virtualrs/js/runtime'

export const HOST_NATIVE_EXPORTS = ['getNativeCapabilities'] as const

function appendExports(out: string[], exports?: readonly string[]): void {
  if (exports) {
    out.push(...exports)
  }
}

function composeNativeExports(): readonly string[] {
  const list = [...HOST_NATIVE_EXPORTS]
  appendExports(list, ATLAS_NATIVE_EXPORTS)
  appendExports(list, STYLETRACE_NATIVE_EXPORTS)
  appendExports(list, ATOMIC_NATIVE_EXPORTS)
  appendExports(list, TASTY_NATIVE_EXPORTS)
  appendExports(list, TYPEGEN_NATIVE_EXPORTS)
  appendExports(list, VIRTUALRS_NATIVE_EXPORTS)
  return list
}

export const REQUIRED_VIRTUAL_NATIVE_EXPORTS = new Proxy([] as readonly string[], {
  get(target, prop, receiver) {
    const list = composeNativeExports()
    const val = Reflect.get(list, prop, receiver)
    return typeof val === 'function' ? val.bind(list) : val
  },
}) as readonly string[]

export const REQUIRED_VIRTUAL_NATIVE_BINARY_MARKERS = REQUIRED_VIRTUAL_NATIVE_EXPORTS
