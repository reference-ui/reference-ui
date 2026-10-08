// Reference types entry: it takes the browser runtime plus the generated
// presentation mirror and emits the composed `Reference` singleton with the
// shipped `@reference-ui/types` surface. The three state views live here
// (entry composition owns them since the mirror shell was buried); the
// factory, runtimes, provider, hooks, formatter, and document types all
// re-export from the browser layer untouched, so the `?name=` pages render
// exactly what core's entry shipped.

import { ReferenceDocumentView } from '../reference/browser-component/components/ReferenceDocumentView.tsx'
import { ReferenceFrame } from '../reference/browser-component/components/ReferenceFrame.tsx'
import { ReferenceNotice } from '../reference/browser-component/components/ReferenceNotice.tsx'
import { MonoText } from '../reference/browser-component/components/shared/MonoText.tsx'
import {
  createDefaultReferenceRuntime,
  createReferenceComponent,
  type ReferenceViews,
} from '../reference/browser/index.ts'

function ReferenceLoadingState({ name }: { name: string }) {
  return (
    <ReferenceNotice>
      Loading reference docs for <MonoText>{name}</MonoText>.
    </ReferenceNotice>
  )
}

function ReferenceErrorState({ name, errorMessage }: { name: string; errorMessage: string }) {
  return (
    <ReferenceNotice>
      Failed to load <MonoText>{name}</MonoText>: {errorMessage}
    </ReferenceNotice>
  )
}

function ReferenceEmptyState({ name }: { name: string }) {
  return (
    <ReferenceNotice>
      No reference document was produced for <MonoText>{name}</MonoText>.
    </ReferenceNotice>
  )
}

const referenceViews: ReferenceViews = {
  Frame: ReferenceFrame,
  DocumentView: ReferenceDocumentView,
  LoadingState: ReferenceLoadingState,
  ErrorState: ReferenceErrorState,
  EmptyState: ReferenceEmptyState,
}

export const Reference = createReferenceComponent(
  createDefaultReferenceRuntime(),
  referenceViews
)

export { createReferenceComponent } from '../reference/browser/index.ts'
export {
  createDefaultReferenceRuntime,
  createReferenceRuntime,
  formatReferenceTypeParameter,
  ReferenceRuntimeProvider,
  useReferenceDocument,
  useReferenceDocumentFromContext,
  useReferenceRuntime,
} from '../reference/browser/index.ts'
export type { ReferenceViews } from '../reference/browser/index.ts'
export type {
  ReferenceDocumentState,
  ReferenceRuntime,
  ReferenceRuntimeData,
} from '../reference/browser/Runtime.ts'
export type * from '../reference/browser/types.ts'
