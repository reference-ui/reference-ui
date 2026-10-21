/**
 * Test file.
 * A component whose props reach StyleProps through a chain of sixty-five declarations, each naming the one before it.
 * It inputs one alias chain past the depth guard and emits one component the guard leaves untraced.
 */

import { Div, type StyleProps } from '@reference-ui/react'

type Link0 = StyleProps
type Link1 = Link0
type Link2 = Link1
type Link3 = Link2
type Link4 = Link3
type Link5 = Link4
type Link6 = Link5
type Link7 = Link6
type Link8 = Link7
type Link9 = Link8
type Link10 = Link9
type Link11 = Link10
type Link12 = Link11
type Link13 = Link12
type Link14 = Link13
type Link15 = Link14
type Link16 = Link15
type Link17 = Link16
type Link18 = Link17
type Link19 = Link18
type Link20 = Link19
type Link21 = Link20
type Link22 = Link21
type Link23 = Link22
type Link24 = Link23
type Link25 = Link24
type Link26 = Link25
type Link27 = Link26
type Link28 = Link27
type Link29 = Link28
type Link30 = Link29
type Link31 = Link30
type Link32 = Link31
type Link33 = Link32
type Link34 = Link33
type Link35 = Link34
type Link36 = Link35
type Link37 = Link36
type Link38 = Link37
type Link39 = Link38
type Link40 = Link39
type Link41 = Link40
type Link42 = Link41
type Link43 = Link42
type Link44 = Link43
type Link45 = Link44
type Link46 = Link45
type Link47 = Link46
type Link48 = Link47
type Link49 = Link48
type Link50 = Link49
type Link51 = Link50
type Link52 = Link51
type Link53 = Link52
type Link54 = Link53
type Link55 = Link54
type Link56 = Link55
type Link57 = Link56
type Link58 = Link57
type Link59 = Link58
type Link60 = Link59
type Link61 = Link60
type Link62 = Link61
type Link63 = Link62
type Link64 = Link63

export function Chained(props: Link64) {
  return <Div {...props} />
}
