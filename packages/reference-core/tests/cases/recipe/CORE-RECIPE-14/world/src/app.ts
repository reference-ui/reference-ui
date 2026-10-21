// Entry for the CORE-RECIPE-14 world. It takes nothing and defines one slotted recipe whose base
// styles a slot its list does not name, so sync refuses the definition by design.
import { recipe } from '@reference-ui/react'

export const panel = recipe({
  className: 'panel',
  slots: ['root', 'title'],
  base: { root: { display: 'flex' }, header: { color: 'red' } },
})
