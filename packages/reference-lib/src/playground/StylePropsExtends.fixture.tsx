import type * as React from 'react'
import { Reference } from '../Reference/index'
import type { StyleProps } from '@reference-ui/react'
import { Div } from '@reference-ui/react'

export type MyType = {
  myCustomProps: string
}
export type StylePropsExtends = MyType & StyleProps

const Component: React.FC<MyType & StyleProps> = ({ myCustomProps, ...props }) => {
  return <Div {...props} />
}

export default <Reference name="StylePropsExtends" />
