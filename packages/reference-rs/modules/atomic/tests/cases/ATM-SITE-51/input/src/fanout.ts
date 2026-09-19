import { css } from '@reference-ui/react'

const tone = pick ? 'red' : 'blue'
export const a = css({ color: `${tone}` })

export const b = css({ borderColor: `${pick ? 'red' : 'blue'}` })

export const c = css({ borderColor: `${pick ? 'red' : maybeFn()}` })

const u1 = pick ? 'a' : 'b'
const u2 = pick ? 'c' : 'd'
const u3 = pick ? 'e' : 'f'
export const d = css({ fontFamily: `${u1}${u2}${u3}` })

const t1 = pick ? 'a' : 'b'
const t2 = pick ? 'c' : 'd'
const t3 = pick ? 'e' : 'f'
const t4 = pick ? 'g' : 'h'
export const e = css({ color: `${t1}${t2}${t3}${t4}`, margin: '4px' })
