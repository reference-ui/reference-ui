import { css } from '@reference-ui/react'
const bag = { barOnly: 'z', bazDown: { color: 'red' } }
const folded = () => ({ quxOnly: { color: 'red' } })
export const unknown = css({ fooOnly: 'x', fooDown: 'y', mdToFoo: { display: 'none' }, ...bag })
export const nested = css({ fooBar: { color: 'red' }, ...folded() })
export const nav = css({ navDown: 'auto' })
export const ranges = css({
  mdOnly: { display: 'block' }, mdDown: { display: 'flex' },
  smToLg: { display: 'grid' }, lgToSm: { display: 'inline' },
})
