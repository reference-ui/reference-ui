import { Div } from '@reference-ui/react'

export function SourceAnonymousContainerQuery() {
  return (
    <Div
      // @ts-expect-error Source fixture exercises boolean container prop extraction.
      container
      r={{
        333: { padding: '1.25rem' },
      }}
    >
      Anonymous Container Query Source Fixture
    </Div>
  )
}
