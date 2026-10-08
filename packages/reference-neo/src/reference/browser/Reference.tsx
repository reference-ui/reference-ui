// Reference shell factory: it takes a data runtime plus injected presentation
// views and emits a `Reference` component rendering loading, error, empty, and
// document states for one symbol name. Views arrive by injection so this module
// never imports the generated presentation mirror; the bundle entry composes
// the factory with the default runtime and the mirror views into `Reference`.

import * as React from 'react'
import { useReferenceDocument, type ReferenceRuntime } from './Runtime.ts'
import type { ReferenceComponentProps, ReferenceDocument } from './types.ts'

/** Presentation views the bundle entry injects (it owns the mirror). */
export interface ReferenceViews {
  Frame: React.ComponentType<{ children: React.ReactNode }>
  DocumentView: React.ComponentType<{ document: ReferenceDocument }>
  LoadingState: React.ComponentType<{ name: string }>
  ErrorState: React.ComponentType<{ name: string; errorMessage: string }>
  EmptyState: React.ComponentType<{ name: string }>
}

export function createReferenceComponent(referenceRuntime: ReferenceRuntime, views: ReferenceViews) {
  const { Frame, DocumentView, LoadingState, ErrorState, EmptyState } = views

  function Reference({ name }: ReferenceComponentProps) {
    const { document, errorMessage, isLoading } = useReferenceDocument(referenceRuntime, name)

    if (isLoading) {
      return (
        <Frame>
          <LoadingState name={name} />
        </Frame>
      )
    }

    if (errorMessage) {
      return (
        <Frame>
          <ErrorState name={name} errorMessage={errorMessage} />
        </Frame>
      )
    }

    if (!document) {
      return (
        <Frame>
          <EmptyState name={name} />
        </Frame>
      )
    }

    return (
      <Frame>
        <DocumentView document={document} />
      </Frame>
    )
  }

  Reference.displayName = 'Reference'
  return Reference
}
