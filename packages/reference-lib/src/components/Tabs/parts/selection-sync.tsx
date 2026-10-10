/**
 * Selection-to-currentness sync: the one direction the RovingFocus
 * kernel cannot infer. Renders null inside the tablist; keyed on the
 * sync target only, so selection and registry changes move the stop
 * while focus-diverged stops are never snapped back. A layout effect
 * on purpose — the write lands before the kernel's passive settlement.
 */
import * as React from 'react'
import { useRovingFocusContext } from '../../RovingFocus'
import { TabsContext } from '../context'
import { useIsomorphicLayoutEffect } from '../shared/layout-effect'


// Selection→currentness sync (TB-SELECT-03, FEATURES #8): the one
// direction the kernel cannot infer. Rendered (rendering null) inside
// the tablist so the RovingFocus context is in scope. Keyed on the
// target only: selection and registry changes move the stop, while
// focus-diverged stops (manual arrows, rejected nav) never re-run the
// effect and are never snapped back. A layout effect on purpose — the
// write lands (with its synchronous re-render) before the kernel's
// passive settlement pass, so initial mount and selection changes win
// over the first-available default. A null target (no enabled tab)
// leaves the all-disabled zero-stop state to kernel settlement.
export function TabsSelectionSync() {
  const tabs = React.useContext(TabsContext)
  const roving = useRovingFocusContext()
  const target = tabs?.selectionSyncTarget ?? null
  const currentId = roving?.currentId ?? null

  useIsomorphicLayoutEffect(() => {
    if (!tabs || !roving || target === null) return
    if (currentId !== target) {
      roving.setCurrentId(target)
    }
    // Deps are the target alone by design (see above); contexts are
    // stable enough (Root memo) and currentId is read fresh per target.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  return null
}
