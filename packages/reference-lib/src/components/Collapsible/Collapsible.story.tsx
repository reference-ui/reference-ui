import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Collapsible } from './index'
import { dividerContent, dividerTrigger } from '../disclosureChrome'

export const Basic = () => {
  const [open, setOpen] = React.useState(false)

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" maxW="100r" data-testid="collapsible-fixture-root">
        <Collapsible open={open} onOpenChange={setOpen}>
          <Collapsible.Trigger {...dividerTrigger} data-testid="btn-collapsible-trigger">
            Toggle Details
          </Collapsible.Trigger>
          <Collapsible.Content
            {...dividerContent}
            data-testid="collapsible-content"
          >
            <Span fontSize="3.5r" color="design.text.light" data-testid="collapsible-text">
              Detailed collapsible content.
            </Span>
          </Collapsible.Content>
        </Collapsible>
      </Div>
    </ReferenceLibrary>
  )
}

export const DefaultOpen = () => {
  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" maxW="100r" data-testid="collapsible-default-open-root">
        <Collapsible defaultOpen>
          <Collapsible.Trigger {...dividerTrigger} data-testid="btn-default-open-trigger">
            Hide details
          </Collapsible.Trigger>
          <Collapsible.Content
            {...dividerContent}
            data-testid="default-open-content"
          >
            <Span fontSize="3.5r" color="design.text.light">
              This section starts open via defaultOpen.
            </Span>
          </Collapsible.Content>
        </Collapsible>
      </Div>
    </ReferenceLibrary>
  )
}
