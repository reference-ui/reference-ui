import * as React from 'react'
import { Button as BaseButton, type ButtonProps } from '@fixtures/demo-ui'

// App-level Button wrapper — defaults to md size, applies
// project-specific conventions on top of @fixtures/demo-ui Button.
export type { ButtonProps }

export function Button(props: ButtonProps): React.ReactElement {
  return <BaseButton size="md" {...props} />
}
