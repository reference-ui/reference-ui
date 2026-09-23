// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/components/Reference/fixtures/StylePropsTypesExtends.book.tsx
 * This file is mirrored into reference-core by tools/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
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
