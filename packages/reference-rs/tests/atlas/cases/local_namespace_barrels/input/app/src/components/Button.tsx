import * as React from 'react'
import { Button as BaseButton, type ButtonProps } from '@fixtures/demo-ui'

export type { ButtonProps }

export function Button(props: ButtonProps): React.ReactElement {
  return <BaseButton {...props} />
}