import * as React from 'react'
import { createTastyBrowserRuntime } from '@reference-ui/rust/tasty/browser'
import type { TastyBrowserRuntime } from '@reference-ui/rust/tasty'
import { Code } from '@reference-ui/react'
import { ReferenceDocumentView, ReferenceFrame, ReferenceNotice } from './components'
import { createReferenceDocument } from './model'
import { createReferenceRuntime } from './Runtime'
import type { ReferenceDocument, ReferenceProps } from './types'

export function createReferenceComponent(runtime: TastyBrowserRuntime) {
  const referenceRuntime = createReferenceRuntime(runtime)

  function Reference({ name }: ReferenceProps) {
    const [document, setDocument] = React.useState<ReferenceDocument | null>(null)
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
      let active = true

      setIsLoading(true)
      setErrorMessage(null)
      setDocument(null)

      void referenceRuntime
        .load(name)
        .then(data => {
          if (!active) return
          setDocument(createReferenceDocument(data.symbol, data.members))
          setIsLoading(false)
        })
        .catch((error: unknown) => {
          if (!active) return
          setErrorMessage(error instanceof Error ? error.message : String(error))
          setIsLoading(false)
        })

      return () => {
        active = false
      }
    }, [name, referenceRuntime])

    if (isLoading) {
      return (
        <ReferenceFrame>
          <ReferenceNotice>
            Loading reference docs for <Code fontFamily="reference.mono">{name}</Code>.
          </ReferenceNotice>
        </ReferenceFrame>
      )
    }

    if (errorMessage) {
      return (
        <ReferenceFrame>
          <ReferenceNotice>
            Failed to load <Code fontFamily="reference.mono">{name}</Code>: {errorMessage}
          </ReferenceNotice>
        </ReferenceFrame>
      )
    }

    if (!document) {
      return (
        <ReferenceFrame>
          <ReferenceNotice>
            No reference document was produced for <Code fontFamily="reference.mono">{name}</Code>.
          </ReferenceNotice>
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

const tastyBrowserRuntime = createTastyBrowserRuntime({
  loadRuntimeModule: () => import('__REFERENCE_UI_TYPES_RUNTIME__' as string),
})

export const Reference = createReferenceComponent(tastyBrowserRuntime)
