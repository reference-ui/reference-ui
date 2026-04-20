import { Div } from '@reference-ui/react'

const TestMarker = Div

export default function JsxElementsTest() {
  return (
    <TestMarker
      data-testid="jsx-elements-marker"
      bg="test.primary"
      color="white"
      padding="test-md"
      borderRadius="test-round"
    >
      Local custom JSX element styled via ui.config.jsxElements
    </TestMarker>
  )
}