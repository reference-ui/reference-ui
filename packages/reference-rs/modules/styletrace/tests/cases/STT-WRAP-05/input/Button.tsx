/**
 * Button wrapper for the plain_react_wrappers station.
 * Converted from fixtures/atlas-project components: wraps the mock
 * fixture-demo-ui Button, which has no Reference connection downstream.
 */
import * as React from 'react'
import { Button as BaseButton, type ButtonProps } from 'fixture-demo-ui'

// App-level Button wrapper — defaults to md size, applies
// project-specific conventions on top of fixture-demo-ui Button.
export type { ButtonProps }

export function Button(props: ButtonProps): React.ReactElement {
  return <BaseButton size="md" {...props} />
}
