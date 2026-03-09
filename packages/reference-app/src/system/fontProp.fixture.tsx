import { Div } from '@reference-ui/react'

export function SourceFontMono() {
  return (
    <Div
      font="mono"
      // @ts-expect-error Source fixture exercises generated custom prop extraction.
      weight="bold"
    >
      Mono Bold Source Fixture
    </Div>
  )
}
