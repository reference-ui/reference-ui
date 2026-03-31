import * as React from 'react'
import { Button as BaseButton, type ButtonProps } from '@fixtures/barrel-ui'

export type { ButtonProps }

export function AppButton(props: ButtonProps): React.ReactElement {
  return <BaseButton {...props} />
}
