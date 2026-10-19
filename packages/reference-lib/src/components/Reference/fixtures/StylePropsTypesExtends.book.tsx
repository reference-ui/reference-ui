/**
 * Type-extends fixture: proves the browser merges extended StyleProps
 * through type-alias intersection. Declares layered aliases plus a custom
 * extension and renders the extended document.
 */
import { Reference } from '../index'
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
