import { recipe } from '@reference-ui/react'

const b1 = recipe({ className: 'duplicateBadge', base: { display: 'inline-flex' } })
const b2 = recipe({ className: 'duplicateBadge', base: { display: 'flex' } })

void b1
void b2
