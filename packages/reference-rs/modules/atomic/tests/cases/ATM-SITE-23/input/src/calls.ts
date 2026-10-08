import { css } from '@reference-ui/react'

// Top-level const ternary: both arms compile like the inline form.
const tone = flag ? 'red.500' : 'blue.500'
export const a = css({ color: tone })

// Nested ternary scoops every arm.
const deep = x ? 'green.500' : y ? 'amber.500' : 'red.500'
export const b = css({ color: deep })

// Logical initializer keeps the non-guard leaf.
const soft = ok && 'blue.500'
export const c = css({ color: soft })
