import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Accordion } from './index'
import { dividerContent, dividerTrigger } from '../disclosureChrome'

export const Single = () => {
  const [value, setValue] = React.useState<string | null>('item-1')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" maxW="100r" data-testid="accordion-fixture-root">
        <Accordion
          data-testid="test-accordion"
          value={value}
          onChange={(v) => setValue(v as string | null)}
          expansion="single"
          display="flex"
          flexDirection="column"
        >
          <Accordion.Item id="item-1">
            <Accordion.Trigger {...dividerTrigger} data-testid="btn-trigger-1">
              Section 1
            </Accordion.Trigger>
            <Accordion.Content {...dividerContent} data-testid="content-1">
              <Span fontSize="3.5r" color="design.text.light">
                Content for section 1
              </Span>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item id="item-2">
            <Accordion.Trigger {...dividerTrigger} data-testid="btn-trigger-2">
              Section 2
            </Accordion.Trigger>
            <Accordion.Content {...dividerContent} data-testid="content-2">
              <Span fontSize="3.5r" color="design.text.light">
                Content for section 2
              </Span>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item id="item-3">
            <Accordion.Trigger {...dividerTrigger} data-testid="btn-trigger-3">
              Section 3
            </Accordion.Trigger>
            <Accordion.Content {...dividerContent} data-testid="content-3">
              <Span fontSize="3.5r" color="design.text.light">
                Content for section 3
              </Span>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </Div>
    </ReferenceLibrary>
  )
}

export const Multiple = () => {
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" maxW="100r" data-testid="accordion-multiple-root">
        <Accordion
          expansion="multiple"
          defaultValue={['item-1', 'item-2']}
          display="flex"
          flexDirection="column"
        >
          <Accordion.Item id="item-1">
            <Accordion.Trigger {...dividerTrigger} data-testid="multi-trigger-1">
              Multi Section 1
            </Accordion.Trigger>
            <Accordion.Content {...dividerContent} data-testid="multi-content-1">
              <Span fontSize="3.5r" color="design.text.light">
                Content for multi section 1
              </Span>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item id="item-2">
            <Accordion.Trigger {...dividerTrigger} data-testid="multi-trigger-2">
              Multi Section 2
            </Accordion.Trigger>
            <Accordion.Content {...dividerContent} data-testid="multi-content-2">
              <Span fontSize="3.5r" color="design.text.light">
                Content for multi section 2
              </Span>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </Div>
    </ReferenceLibrary>
  )
}
