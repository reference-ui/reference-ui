// Minimal fixture for ATM-E-RECIPE-SPREAD in the CORE-DIAG-17 world. It
// takes the generated recipe helper and spreads a base object into the
// recipe config. Compiling the world must surface the code as an error with
// a non-blank message.
import { recipe } from '@reference-ui/react'

const rest = { base: { color: 'blue' } }
export const r = recipe({ className: 'spreadr', ...rest })
