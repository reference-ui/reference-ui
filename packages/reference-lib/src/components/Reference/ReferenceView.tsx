/**
 * ReferenceView: the provider-less API browser half. Reads the named
 * document from the ambient runtime context and renders loading, error,
 * empty, or document states; hosts install the provider themselves.
 */
import * as React from 'react'
import {
  useReferenceDocumentFromContext,
  type ReferenceComponentProps,
} from '@reference-ui/types'
import { ReferenceDocument } from './document/index'
import { ReferenceHeadingLevelProvider } from './document/ReferenceHeadingLevel'
import { ReferenceFrame } from './components/ReferenceFrame'
import {
  ReferenceEmptyState,
  ReferenceErrorState,
  ReferenceLoadingState,
} from './ReferenceStatus'

export function ReferenceView({ name, headingLevel = 2 }: ReferenceComponentProps) {
  const { document, errorMessage, isLoading } = useReferenceDocumentFromContext(name)

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
      <ReferenceHeadingLevelProvider value={headingLevel}>
        <ReferenceDocument document={document} />
      </ReferenceHeadingLevelProvider>
    </ReferenceFrame>
  )
}
