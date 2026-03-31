import { Div } from '@reference-ui/react'
import { DemoComponent, LightDarkDemo } from '@fixtures/extend-library'

/**
 * Renders real fixture-library components. The base environment extends the
 * fixture baseSystem so downstream sandboxes exercise package-based extends.
 */
export default function ExtendsTest() {
  return (
    <Div data-testid="extends-test" display="grid" gap="16px">
      <DemoComponent />
      <LightDarkDemo />
    </Div>
  )
}
