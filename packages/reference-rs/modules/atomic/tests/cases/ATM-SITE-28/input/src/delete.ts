import { css } from '@reference-ui/react'

// SPEC-V2-81: `delete` invalidates the collected init like an assignment.
const delMember = { color: 'red' }
delete delMember.color
export const a = css({ color: delMember.color })

// A computed `delete` poisons the root too; the key stays a read.
const delKey = { color: 'red' }
delete delKey['color']
export const b = css({ color: delKey.color })

// A deleted object spread keeps its siblings and names the delete.
const delSpread = { color: 'red' }
delete delSpread.color
export const c = css({ ...delSpread, margin: '3px' })
