import * as ui from './ui'

// Namespace over the wrapper: `ui.css` and `ui.recipe` are live.
export const a = ui.css({ color: 'plum' })
export const card = ui.recipe({
  className: 'site55ns',
  base: { fontWeight: 'bold' },
})
