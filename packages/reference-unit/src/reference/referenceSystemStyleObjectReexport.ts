/**
 * Opt-in barrel so `ref sync` indexes this symbol for {@link Reference}.
 * Use `export type { … } from '…'` — Tasty registers these without a local alias.
 */
import type { StyleProps } from '@reference-ui/react'

export type { StyleProps } from '@reference-ui/react'

export interface ReferenceStylePropsExtendsFixture extends StyleProps {
  localTone?: 'soft' | 'strong'
}
