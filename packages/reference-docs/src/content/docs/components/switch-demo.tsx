// Live Switch demos for the Switch component page.
// They take nothing and emit the toggle plus visual variants. Colocated with the page that
// embeds them.
import { useState } from 'react'
import { Div, Label } from '@reference-ui/react'
import { Switch } from '@reference-ui/lib'

/** A labelled switch whose checked state lives in the demo. */
export function SwitchDemo() {
  const [enabled, setEnabled] = useState(false)
  return (
    <Div display="flex" alignItems="center" gap="3r">
      <Label htmlFor="switch-demo-airplane">Airplane mode</Label>
      <Switch id="switch-demo-airplane" checked={enabled} onChange={setEnabled} />
    </Div>
  )
}

/** An uncontrolled switch, a disabled one, and one with an authored square thumb. */
export function SwitchVariantsDemo() {
  return (
    <Div display="flex" flexDirection="column" gap="3r">
      <Label display="flex" alignItems="center" gap="3r">
        <Switch defaultChecked />
        Notifications
      </Label>
      <Label display="flex" alignItems="center" gap="3r">
        <Switch disabled />
        Sync (unavailable)
      </Label>
      <Label display="flex" alignItems="center" gap="3r">
        <Switch defaultChecked borderRadius="md">
          <Switch.Thumb borderRadius="sm" />
        </Switch>
        Compact mode
      </Label>
    </Div>
  )
}
