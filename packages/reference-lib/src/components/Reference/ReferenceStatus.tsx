/**
 * Reference status states: the loading, error, and empty notices rendered
 * inside the frame. Take the requested name (plus the error message);
 * each renders its copy through `ReferenceNotice` with mono highlights.
 */
import * as React from 'react'
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
