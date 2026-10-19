// Minimal fixture for ATM-E-DUPLICATE-RECIPE in the CORE-DIAG-19 world. It
// takes the generated recipe helper and declares `duplicateBadge` twice with
// different bases. Compiling the world must surface the code as an error
// with a non-blank message.
import { recipe } from '@reference-ui/react'

const b1 = recipe({ className: 'duplicateBadge', base: { display: 'inline-flex' } })
const b2 = recipe({ className: 'duplicateBadge', base: { display: 'flex' } })

void b1
void b2
