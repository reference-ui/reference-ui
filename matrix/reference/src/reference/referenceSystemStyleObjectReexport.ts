/**
 * Opt-in barrel so `ref sync` indexes this symbol for `Reference`.
 * Keep a local type alias so Tasty emits a concrete top-level `StyleProps` symbol
 * with projected members, rather than only an external re-export reference.
 */
import type { SystemStyleObject } from '@reference-ui/system'

type ReferenceProps = {
  container?: string | boolean
  r?: Record<string | number, SystemStyleObject>
}

export type StyleProps = SystemStyleObject & ReferenceProps

export type ReferenceStylePropsExtendsFixture = StyleProps & {
  localTone?: 'soft' | 'strong'
}

export type ReferenceStylePropsTypeBaseFixture = StyleProps & {
  localFlag?: boolean
}

export type ReferenceStylePropsTypeExtendsFixture =
  ReferenceStylePropsTypeBaseFixture & {
    localTone?: 'soft' | 'strong'
  }