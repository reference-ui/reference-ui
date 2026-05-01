import { Div } from '@reference-ui/react'

export function SourceCombinedCustomProps() {
  return (
    <Div
      font="sans"
      weight="bold"
      container="card"
      r={{
        555: { padding: '2.25rem' },
      }}
    >
      Combined Custom Props Source Fixture
    </Div>
  )
}