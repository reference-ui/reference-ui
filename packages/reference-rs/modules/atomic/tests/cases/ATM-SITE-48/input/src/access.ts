import { css } from '@reference-ui/react'

const colors = { red: 'red', blue: 'blue' }
const sizes = ['4px', '8px']
const k = 'blue'
const i = 1

// Literal indices over const tables.
css({ color: colors['red'] })
css({ margin: sizes[1] })
css({ margin: sizes['0'] })

// Folded identifier indices (single- and multi-leaf).
css({ color: colors[k] })
css({ margin: sizes[i] })
declare const flag: boolean
const pick = flag ? 'red' : 'blue'
css({ color: colors[pick] })

// Member, nested, and inline-table reads.
const idx = { n: 'red' }
css({ color: colors[idx.n] })
const names = ['blue']
css({ color: colors[names[0]] })
css({ color: ['red', 'blue'][1] })
css({ color: ({ tone: 'blue' })['tone'] })
css({ margin: sizes?.[i] })

// Holes omit silently; siblings still land.
const holey = ['4px', , '12px']
css({ margin: holey[1], padding: '2px' })
css({ margin: holey[2] })

// Element reads under conditions ride the same walker.
css({ _hover: { color: colors['blue'] } })

// Concat and interpolated indices fold through the shared nodes (entry 63).
const shades = { red: 'red', blue: 'blue' }
css({ color: shades['r' + 'ed'] })
css({ color: shades[`bl${'ue'}`] })

// Chained reads resolve inside out through nested entries (entry 63).
const swatches = { red: { 500: 'red' } }
css({ color: swatches['red']['500'] })
css({ color: swatches.red['500'] })
const pal = { a: { b: { c: 'blue' } } }
css({ color: pal['a']['b']['c'] })
const matrix = [{ tone: 'red' }]
css({ color: matrix[0]['tone'] })
