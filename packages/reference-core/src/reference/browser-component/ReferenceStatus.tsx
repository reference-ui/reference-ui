// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/Reference/ReferenceStatus.tsx
 * This file is mirrored into reference-core by tools/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
 */
import { ReferenceNotice } from './components/ReferenceNotice'
import { MonoText } from './components/shared/MonoText'

export function ReferenceLoadingState({ name }: { name: string }) {
  return (
    <ReferenceNotice>
      Loading reference docs for <MonoText>{name}</MonoText>.
    </ReferenceNotice>
  )
}

export function ReferenceErrorState({ name, errorMessage }: { name: string; errorMessage: string }) {
  return (
    <ReferenceNotice>
      Failed to load <MonoText>{name}</MonoText>: {errorMessage}
    </ReferenceNotice>
  )
}

export function ReferenceEmptyState({ name }: { name: string }) {
  return (
    <ReferenceNotice>
      No reference document was produced for <MonoText>{name}</MonoText>.
    </ReferenceNotice>
  )
}
