import * as React from 'react'
import { Accordion } from '@reference-ui/lib'

export function AccordionFixture() {
  const [value, setValue] = React.useState<string | null>('item-1')

  return (
    <div data-testid="accordion-fixture-root">
      <h1>Accordion Fixture</h1>

      <Accordion
        data-testid="test-accordion"
        value={value}
        onChange={setValue}
        expansion="single"
      >
        <Accordion.Item id="item-1">
          <Accordion.Trigger data-testid="btn-trigger-1">
            Section 1
          </Accordion.Trigger>
          <Accordion.Content data-testid="content-1">
            <p>Content for section 1</p>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item id="item-2">
          <Accordion.Trigger data-testid="btn-trigger-2">
            Section 2
          </Accordion.Trigger>
          <Accordion.Content data-testid="content-2">
            <p>Content for section 2</p>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </div>
  )
}
