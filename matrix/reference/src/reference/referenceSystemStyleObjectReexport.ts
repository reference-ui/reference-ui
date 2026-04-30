/**
 * Opt-in barrel so `ref sync` indexes this symbol for `Reference`.
 * Use `export type { ... } from '...'` so Tasty registers the public type.
 */
import type { StyleProps } from '@reference-ui/react'

export type { StyleProps } from '@reference-ui/react'

export interface ReferenceStylePropsExtendsFixture extends StyleProps {
  localTone?: 'soft' | 'strong'
}

export type ReferenceStylePropsTypeBaseFixture = StyleProps & {
  localFlag?: boolean
}

export type ReferenceStylePropsTypeExtendsFixture =
  ReferenceStylePropsTypeBaseFixture & {
    localTone?: 'soft' | 'strong'
  }