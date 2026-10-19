// Live Accordion demos for the Accordion component page.
// They take nothing and emit single and multiple expansion. Colocated with the page that
// embeds them.
import { Div, P, css } from '@reference-ui/react'
import { Accordion } from '@reference-ui/lib'

const column = css({ display: 'flex', flexDirection: 'column', gap: '2r' })

/** Single expansion: opening one item closes the open one. */
export function AccordionDemo() {
  return (
    <Div width="100%" maxWidth="100r">
      <Accordion className={column}>
        <Accordion.Item id="billing">
          <Accordion.Trigger>Billing</Accordion.Trigger>
          <Accordion.Content>
            <P>Invoices and payment methods.</P>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item id="team">
          <Accordion.Trigger>Team</Accordion.Trigger>
          <Accordion.Content>
            <P>Members and roles.</P>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item id="security">
          <Accordion.Trigger>Security</Accordion.Trigger>
          <Accordion.Content>
            <P>Sessions and two-factor sign-in.</P>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </Div>
  )
}

/** Multiple expansion: items open and close independently. */
export function AccordionMultipleDemo() {
  return (
    <Div width="100%" maxWidth="100r">
      <Accordion expansion="multiple" className={column}>
        <Accordion.Item id="shipping">
          <Accordion.Trigger>Shipping</Accordion.Trigger>
          <Accordion.Content>
            <P>Ships in two working days.</P>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item id="returns">
          <Accordion.Trigger>Returns</Accordion.Trigger>
          <Accordion.Content>
            <P>Free returns within 30 days.</P>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item id="warranty" disabled>
          <Accordion.Trigger>Warranty</Accordion.Trigger>
          <Accordion.Content>
            <P>Two years on parts.</P>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </Div>
  )
}
