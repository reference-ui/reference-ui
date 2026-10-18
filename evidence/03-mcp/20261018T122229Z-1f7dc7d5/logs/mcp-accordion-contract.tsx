import { Accordion, Collapsible } from '@reference-ui/lib'

// Documented style props and a documented child work as the baseline.
export const documented = (
  <Accordion padding="4r">
    <Collapsible id="billing">
      <Collapsible.Trigger>Billing</Collapsible.Trigger>
      <Collapsible.Content>Invoices</Collapsible.Content>
    </Collapsible>
  </Accordion>
)

// get_component/get_component_props advertise defaultValue as supported.
export const advertised = <Accordion defaultValue="billing" />
