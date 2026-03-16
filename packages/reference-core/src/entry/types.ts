/**
 * @reference-ui/types entry
 * Runtime reference APIs plus generated Tasty metadata subpaths.
 */

import {
  createReferenceComponent,
  type ReferenceRuntimeModule,
} from '../reference/component'

let runtimeModulePromise: Promise<ReferenceRuntimeModule> | undefined

function loadReferenceRuntime(): Promise<ReferenceRuntimeModule> {
  if (!runtimeModulePromise) {
    runtimeModulePromise = import('__REFERENCE_UI_TYPES_RUNTIME__' as string) as Promise<ReferenceRuntimeModule>
  }

  return runtimeModulePromise
}

export const Reference = createReferenceComponent(loadReferenceRuntime)

export type { ReferenceProps } from '../reference/component'
