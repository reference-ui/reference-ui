import { css } from '@reference-ui/react'

const c1 = css({ display: 'flex' }, { alignItems: 'center' })
const c2 = css.raw({ gap: '2r' })
css({ margin: '1r' }, { padding: '2r' }, { color: 'red' })
void c1
void c2
