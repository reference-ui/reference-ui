import { Div } from '@reference-ui/react'

export function SourceCombinedCustomProps() {
  return (
    <Div
      font="sans"
      // @ts-expect-error Source fixture exercises generated custom prop extraction.
      weight="semibold"
      container="card"
      r={{
        555: { padding: '2.25rem' },
      }}
    >
      Combined Custom Props Source Fixture
    </Div>
  )
}
