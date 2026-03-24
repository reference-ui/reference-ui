import type * as React from 'react'
import { Reference } from '../Reference/index'
import type { StyleProps } from '@reference-ui/react'
import { Div } from '@reference-ui/react'

export type StylePropsExtends = {
  myCustomProps: string
}

const Component: React.FC<StylePropsExtends & StyleProps> = ({
  myCustomProps,
  ...props
}) => {
  return <Div {...props} />
}

export default <Reference name="StylePropsExtends" />
