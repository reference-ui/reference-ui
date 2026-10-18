// Global fragment for the TOKEN-15 world. It takes the neo fragment
// collector and emits the canonical rescale knob: one `:root` line at
// `0.5rem`, doubling every rhythm value over the baked `0.25rem` default.
import { globalCss } from '@reference-ui/neo'

globalCss({ ':root': { '--spacing-root': '0.5rem' } })
