import { Div, P } from '@reference-ui/react'
import { Collapsible } from '@reference-ui/lib'

/** A self-managed disclosure: no `open` passed, so it starts closed. */
export function CollapsibleDemo() {
  return (
    <Div width="100%" maxWidth="100r">
      <Collapsible>
        <Collapsible.Trigger>Order details</Collapsible.Trigger>
        <Collapsible.Content>
          <P>Shipped on 12 October. Arrives in three to five working days.</P>
        </Collapsible.Content>
      </Collapsible>
    </Div>
  )
}
