/**
 * Reference: the public API browser. Installs the default
 * `@reference-ui/types` runtime and renders the named export's document
 * through `ReferenceView`; takes the export name and the title's heading
 * level.
 */
import * as React from 'react'
import { ReferenceRuntimeProvider, createDefaultReferenceRuntime } from '@reference-ui/types'
import type { ReferenceComponentProps } from './types'
import { ReferenceView } from './ReferenceView'

const runtime = createDefaultReferenceRuntime()

export function Reference({ name, headingLevel }: ReferenceComponentProps) {
  return (
    <ReferenceRuntimeProvider runtime={runtime}>
      <ReferenceView name={name} headingLevel={headingLevel} />
    </ReferenceRuntimeProvider>
  )
}
