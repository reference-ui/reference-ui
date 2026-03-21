/**
 * @reference-ui/types entry
 * Runtime reference APIs plus generated Tasty metadata subpaths.
 *
 * `reference/browser` (component + primitives) and `@reference-ui/rust/tasty/browser`
 * are bundled into the emitted `types.mjs` by the packager, so users don't need to
 * install `@reference-ui/rust`. Panda still scans the mirrored `_reference-component`
 * sources in `.reference-ui/virtual` from the bridge worker.
 */

import { createTastyBrowserRuntime } from '@reference-ui/rust/tasty/browser'
import { createReferenceComponent } from '../reference/browser'

const tastyBrowserRuntime = createTastyBrowserRuntime({
  loadRuntimeModule: () => import('__REFERENCE_UI_TYPES_RUNTIME__' as string),
})

export const Reference = createReferenceComponent(tastyBrowserRuntime)

export type { ReferenceProps } from '../reference/browser'
