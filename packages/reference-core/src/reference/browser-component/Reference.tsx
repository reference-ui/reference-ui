// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/Reference/Reference.tsx
 * This file is mirrored into reference-core by tools/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
 */
import {
  ReferenceRuntimeProvider,
  createDefaultReferenceRuntime,
  type ReferenceComponentProps,
} from '../browser/component-api'
import { ReferenceView } from './ReferenceView'

const runtime = createDefaultReferenceRuntime()

export function Reference({ name }: ReferenceComponentProps) {
  return (
    <ReferenceRuntimeProvider runtime={runtime}>
      <ReferenceView name={name} />
    </ReferenceRuntimeProvider>
  )
}
