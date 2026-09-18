// Global fragment for the TOKEN-13 world. It takes the neo fragment
// collector and emits the rhythm root the keyframe widths resolve against.
// Without it the keyframe calcs would reference an undefined variable.
import { globalCss } from '@reference-ui/neo'

globalCss({ ':root': { '--spacing-root': '0.25rem' } })
