/**
 * Reference: the public API browser. Installs the default
 * `@reference-ui/types` runtime and renders the named export's document
 * through `ReferenceView`; takes the export name only.
 */
import * as React from 'react'
import {
  ReferenceRuntimeProvider,
  createDefaultReferenceRuntime,
  type ReferenceComponentProps,
} from '@reference-ui/types'
import { ReferenceView } from './ReferenceView'

const runtime = createDefaultReferenceRuntime()

export function Reference({ name }: ReferenceComponentProps) {
  return (
    <ReferenceRuntimeProvider runtime={runtime}>
      <ReferenceView name={name} />
    </ReferenceRuntimeProvider>
  )
}
