import { css } from '@reference-ui/react'
const bag = { barOnly: 'z' }
export const unknown = css({ fooOnly: 'x', fooDown: 'y', mdToFoo: { display: 'none' }, ...bag })
export const ranges = css({
  mdOnly: { display: 'block' }, mdDown: { display: 'flex' },
  smToLg: { display: 'grid' }, lgToSm: { display: 'inline' },
})
