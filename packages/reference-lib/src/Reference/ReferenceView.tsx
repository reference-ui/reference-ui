import {
  useReferenceDocumentFromContext,
  type ReferenceProps,
} from '@reference-ui/types'
import { ReferenceDocumentView } from './components/ReferenceDocumentView.js'
import { ReferenceFrame } from './components/ReferenceFrame.js'
import {
  ReferenceEmptyState,
  ReferenceErrorState,
  ReferenceLoadingState,
} from './ReferenceStatus.js'

export function ReferenceView({ name }: ReferenceProps) {
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
      <ReferenceDocumentView document={document} />
    </ReferenceFrame>
  )
}
