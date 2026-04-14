import { Reference } from '../Reference/index'
import type { StyleProps } from '@reference-ui/react'

export type LocalTypeBase = {
  localFlag?: boolean
}

export type StylePropsTypeExtends = StyleProps & LocalTypeBase

export type MyExtendedType = StylePropsTypeExtends & {
  myCustomProps: string
  status?: 'idle' | 'loading'
}

export default <Reference name="MyExtendedType" />
