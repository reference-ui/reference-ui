import * as React from 'react'
import BaseButton, { type ButtonProps } from '@fixtures/default-barrel-ui'

export type { ButtonProps }

export function AppButton(props: ButtonProps): React.ReactElement {
  return <BaseButton {...props} />
}
