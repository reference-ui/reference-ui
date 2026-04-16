import {
  useReferenceDocumentFromContext,
  type ReferenceComponentProps,
} from '@reference-ui/types'
import { ReferenceDocument } from './document/index'
import { ReferenceFrame } from './components/ReferenceFrame'
import {
  ReferenceEmptyState,
  ReferenceErrorState,
  ReferenceLoadingState,
} from './ReferenceStatus'

export function ReferenceView({ name }: ReferenceComponentProps) {
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
      <ReferenceDocument document={document} />
    </ReferenceFrame>
  )
}
