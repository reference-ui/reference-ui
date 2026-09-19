import { css } from '@reference-ui/react'

const k = 'color'
const t = { p: 'margin' }
const s = ['padding']
const hov = '_hover'

// Folded keys resolve exactly like their bare spellings.
css({ [k]: 'red' })
css({ [t.p]: '4px' })
css({ [s[0]]: '8px' })
css({ [hov]: { color: 'red' } })
css({ [hov]: { [k]: 'blue' } })

// A folded numeric key rides the unknown-property path, never UnfoldableKey.
const n = 42
css({ [n]: 'red' })
const pad = 4
css({ [-pad]: 'red' })

// Multi-leaf and helper keys refuse with siblings kept (SPEC-V2-40 pins here).
declare const flag: boolean
const mk = flag ? 'color' : 'margin'
css({ [mk]: 'red', padding: '4px' })
const gh = (name: string) => `&[data-group="${name}"]`
css({ [gh('cool')]: { color: 'red' }, margin: '8px' })

// Concat keys fold through the shared binary node (entry 64).
css({ ['col' + 'or']: 'red' })
css({ ['mar' + 'gin']: '4px' })

// A multi-leaf concat key is ambiguous and refuses, sibling kept.
const mk2 = flag ? 'olor' : 'argin'
css({ ['c' + mk2]: 'red', padding: '12px' })
