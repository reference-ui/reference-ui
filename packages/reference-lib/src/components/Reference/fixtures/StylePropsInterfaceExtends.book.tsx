/**
 * Interface-extends fixture: proves the browser merges extended
 * StyleProps through interface inheritance. Declares a local base plus a
 * custom extension and renders the extended document.
 */
import { Reference } from '../index'
import type { StyleProps } from '@reference-ui/react'

export type LocalBaseStyleProps = StyleProps & {
  localBaseTone?: 'soft' | 'strong'
}

export type MyExtendedInterface = LocalBaseStyleProps & {
  myCustomProps: string
  mode?: 'composed' | 'inline'
}

export default <Reference name="MyExtendedInterface" />
