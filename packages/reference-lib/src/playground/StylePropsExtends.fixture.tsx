import type * as React from 'react'
import { Reference } from '../Reference/index'
import type { HTMLStyledProps, StyleProps } from '@reference-ui/react'
import { Div } from '@reference-ui/react'

export type MyType = {
  myCustomProps: string
}
export type StylePropsExtends = MyType & StyleProps

export type MyExtendedType = HTMLStyledProps<'div'> & {
  myCustomProps: string
}
export interface MyExtendedInterface extends StyleProps {
  myCustomProps: string
}

const Component: React.FC<MyExtendedType> = ({ myCustomProps, ...props }) => {
  return <Div {...props} />
}

export default <Reference name="MyExtendedType" />
