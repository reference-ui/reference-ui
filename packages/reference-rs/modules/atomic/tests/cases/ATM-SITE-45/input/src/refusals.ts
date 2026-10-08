import { css, token } from '@reference-ui/react'

declare const dyn: string
declare const flag: boolean

const multi = flag ? 'colors.red.500' : 'colors.gray.800'
const shade = '500'
const args = ['colors.red.500']

export const r1 = css({ color: token(dyn), margin: '1r' })
export const r2 = css({ color: token(multi), margin: '2r' })
export const r3 = css({ color: token('colors.red.500', dyn), margin: '3r' })
export const r4 = css({ color: token(''), margin: '4r' })
export const r5 = css({ color: token('a', 'b', 'c'), margin: '5r' })
export const r6 = css({ color: token(), margin: '6r' })
export const r7 = css({ color: token.foo('colors.red.500'), margin: '7r' })
export const r8 = css({ color: token(`colors.red.${shade}`), margin: '8r' })
export const r9 = css({ color: token(...args), margin: '9r' })
export const r10 = css({ color: token('colors.nope.996'), margin: '10r' })

export function shadowed() {
  function token(p: string) {
    console.log(p)
    return p
  }
  return css({ color: token('colors.red.500'), margin: '11r' })
}
