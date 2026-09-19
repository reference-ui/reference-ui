import { css } from '@reference-ui/react'

const colors = { red: 'red', blue: 'blue' }
const sizes = ['4px', '8px']

// An unfoldable index refuses with the index named; siblings survive.
declare const dk: string
css({ color: colors[dk], padding: '4px' })
declare function pick(): string
css({ color: colors[pick()], padding: '8px' })

// An unfoldable base refuses with the base named; siblings survive.
declare const maybe: Record<string, string>
css({ color: maybe['red'], margin: '4px' })

// A folded index with no entry — or past the end — warns per key.
css({ color: colors['typo'], padding: '12px' })
css({ margin: sizes[9], padding: '16px' })
declare const flag: boolean
const kk = flag ? 'red' : 'typo'
css({ color: colors[kk] })

// A chained read is single-hop only (nested tables ride SITE-29).
css({ color: colors['red']['length'], padding: '20px' })

// A reassigned table reads stale, never its init.
let mut = ['4px', '8px']
mut = ['12px']
css({ margin: mut[0], padding: '24px' })
