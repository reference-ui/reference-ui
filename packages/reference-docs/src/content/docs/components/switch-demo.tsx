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
