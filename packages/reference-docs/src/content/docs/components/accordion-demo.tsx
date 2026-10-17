import { Div, P, css } from '@reference-ui/react'
import { Accordion, Collapsible } from '@reference-ui/lib'

const column = css({ display: 'flex', flexDirection: 'column', gap: '2r' })

/** A single-expansion accordion over three Collapsibles. */
export function AccordionDemo() {
  return (
    <Div width="100%" maxWidth="100r">
      <Accordion className={column}>
        <Collapsible id="billing">
          <Collapsible.Trigger>Billing</Collapsible.Trigger>
          <Collapsible.Content>
            <P>Invoices and payment methods.</P>
          </Collapsible.Content>
        </Collapsible>
        <Collapsible id="team">
          <Collapsible.Trigger>Team</Collapsible.Trigger>
          <Collapsible.Content>
            <P>Members and roles.</P>
          </Collapsible.Content>
        </Collapsible>
        <Collapsible id="security">
          <Collapsible.Trigger>Security</Collapsible.Trigger>
          <Collapsible.Content>
            <P>Sessions and two-factor sign-in.</P>
          </Collapsible.Content>
        </Collapsible>
      </Accordion>
    </Div>
  )
}
