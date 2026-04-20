import { Div } from '@reference-ui/react'

const UnitMarker = Div

export function JsxElementsFixture() {
  return (
    <UnitMarker data-testid="unit-marker" bg="fixtureDemoAccent" padding="test-md">
      Configured custom JSX element
    </UnitMarker>
  )
}