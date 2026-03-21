import { createTastyBrowserRuntime } from '@reference-ui/rust/tasty/browser'
import { createReferenceComponent } from './component'

const tastyBrowserRuntime = createTastyBrowserRuntime({
  loadRuntimeModule: () => import('__REFERENCE_UI_TYPES_RUNTIME__' as string),
})

export const Reference = createReferenceComponent(tastyBrowserRuntime)
