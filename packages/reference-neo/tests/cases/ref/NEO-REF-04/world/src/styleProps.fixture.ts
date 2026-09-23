// StyleProps fixture: it declares the public style symbol plus the local extending fixtures.
// The import targets the generated styled types subpath, which tasty resolves through the linked package after sync.
// This is the one deliberate adaptation from the matrix oracle: core read SystemStyleObject off @reference-ui/system,
// but the neo generated system package carries no style surface, so the fixture names the styled decls directly.
import type { SystemStyleObject } from '@reference-ui/styled/types'

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
