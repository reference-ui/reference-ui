import * as React from 'react'
import { ReferenceDocumentView, ReferenceFrame } from './components'
import {
  ReferenceEmptyState,
  ReferenceErrorState,
  ReferenceLoadingState,
} from './ReferenceStatus'
import { createDefaultReferenceRuntime, useReferenceDocument, type ReferenceRuntime } from './Runtime'
import type { ReferenceComponentProps } from './types'

export function createReferenceComponent(referenceRuntime: ReferenceRuntime) {
  function Reference({ name }: ReferenceComponentProps) {
    const { document, errorMessage, isLoading } = useReferenceDocument(referenceRuntime, name)

    if (isLoading) {
      return (
        <ReferenceFrame>
          <ReferenceLoadingState name={name} />
        </ReferenceFrame>
      )
    }

    if (errorMessage) {
      return (
        <ReferenceFrame>
          <ReferenceErrorState name={name} errorMessage={errorMessage} />
        </ReferenceFrame>
      )
    }

    if (!document) {
      return (
        <ReferenceFrame>
          <ReferenceEmptyState name={name} />
        </ReferenceFrame>
      )
    }

    return (
      <ReferenceFrame>
        <ReferenceDocumentView document={document} />
      </ReferenceFrame>
    )
  }

  Reference.displayName = 'Reference'
  return Reference
}

export const Reference = createReferenceComponent(createDefaultReferenceRuntime())
