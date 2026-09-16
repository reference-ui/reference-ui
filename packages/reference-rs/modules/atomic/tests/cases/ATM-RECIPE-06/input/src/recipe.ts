import { recipe } from '@reference-ui/react'

// Missing className
const r1 = recipe({
  base: { color: 'red' },
})

// Dynamic argument
const dyn = { className: 'dyn' }
const r2 = recipe(dyn as any)

// Duplicate className
const b1 = recipe({
  className: 'duplicateBadge',
  base: { display: 'inline-flex' },
})

const b2 = recipe({
  className: 'duplicateBadge',
  base: { display: 'flex' },
})

void r1
void r2
void b1
void b2
