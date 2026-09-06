import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { Switch } from './index'

export default {
  Default: () => {
    const [checked, setChecked] = React.useState(false)
    return (
      <Div display="flex" alignItems="center" gap="3r">
        <Switch checked={checked} onChange={setChecked} />
        <Span>{checked ? 'Checked' : 'Unchecked'}</Span>
      </Div>
    )
  },
  CheckedByDefault: () => {
    return (
      <Div display="flex" alignItems="center" gap="3r">
        <Switch defaultChecked />
        <Span>Default Checked</Span>
      </Div>
    )
  },
  Disabled: () => {
    return (
      <Div display="flex" flexDirection="column" gap="3r">
        <Div display="flex" alignItems="center" gap="3r">
          <Switch disabled checked={false} />
          <Span color="design.text.light">Disabled Unchecked</Span>
        </Div>
        <Div display="flex" alignItems="center" gap="3r">
          <Switch disabled checked={true} />
          <Span color="design.text.light">Disabled Checked</Span>
        </Div>
      </Div>
    )
  },
}
