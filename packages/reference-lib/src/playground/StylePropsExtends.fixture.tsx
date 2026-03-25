import type * as React from 'react'
import { Reference } from '../Reference/index'
import type { HTMLStyledProps, StyleProps, SystemStyleObject } from '@reference-ui/react'
import { Div } from '@reference-ui/react'

export type MyType = {
  myCustomProps: string
}
export type StylePropsExtends = MyType & StyleProps

export type MyExtendedType = HTMLStyledProps<'div'> & {
  myCustomProps: string
}
export type MyExtendedInterface = StyleProps & {
  myCustomProps: string
}

const Component: React.FC<MyExtendedType> = props => {
  const { myCustomProps, ...rest } = props as unknown as Record<string, unknown>
  return <Div {...(rest as StyleProps)} />
}

export default <Reference name="MyExtendedType" />
