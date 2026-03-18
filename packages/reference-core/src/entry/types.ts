/**
 * @reference-ui/types entry
 * Runtime reference APIs plus generated Tasty metadata subpaths.
 */

import { createTastyBrowserRuntime } from '@reference-ui/rust/tasty/browser'
import { createReferenceComponent } from '../reference/browser'

const tastyBrowserRuntime = createTastyBrowserRuntime({
  loadRuntimeModule: () => import('__REFERENCE_UI_TYPES_RUNTIME__' as string),
})

export const Reference = createReferenceComponent(tastyBrowserRuntime)

export type { ReferenceProps } from '../reference/browser'
