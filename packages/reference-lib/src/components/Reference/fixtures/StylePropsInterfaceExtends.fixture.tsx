import { Reference } from '../index'
import type { StyleProps } from '@reference-ui/react'

export interface LocalBaseStyleProps extends StyleProps {
  localBaseTone?: 'soft' | 'strong'
}

export interface MyExtendedInterface extends LocalBaseStyleProps {
  myCustomProps: string
  mode?: 'composed' | 'inline'
}

export default <Reference name="MyExtendedInterface" />
