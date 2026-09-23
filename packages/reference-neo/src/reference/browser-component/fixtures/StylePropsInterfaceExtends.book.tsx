// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/components/Reference/fixtures/StylePropsInterfaceExtends.book.tsx
 * This file is mirrored into reference-core by tools/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
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
