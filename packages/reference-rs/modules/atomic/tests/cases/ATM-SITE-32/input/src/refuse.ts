import { css } from '@reference-ui/react'

declare function getColor(): string

const roll = (xs: string[]) => xs[Math.floor(Math.random() * xs.length)]!
export const random = css({ color: roll(['red']), margin: '1r' })

async function fetchColor(): Promise<string> {
  return 'red'
}
export const asyncCall = css({ color: fetchColor(), margin: '2r' })

function sum(n: number): string {
  let acc = ''
  for (let i = 0; i < n; i++) acc += 'r'
  return acc
}
export const loopHelper = css({ color: sum(3), margin: '3r' })

export const mapChain = css({ color: ['red'].map(x => x + x)[0], margin: '4r' })
export const reduceChain = css({ color: [1, 2].reduce(acc => acc, 'red'), margin: '5r' })

function first(...args: string[]) {
  return args[0]!
}
export const restParams = css({ color: first('red'), margin: '6r' })

function inner() {
  return 'red'
}
function outer() {
  return inner()
}
export const nestedCall = css({ color: outer(), margin: '7r' })

function ident(x: string) {
  return x
}
export const spreadArgs = css({ color: ident(...['red']), margin: '8r' })
export const optionalCall = css({ color: getColor?.(), margin: '9r' })

const pickTone = ({ color }: { color: string }) => color
export const destructuredParams = css({
  color: pickTone({ color: 'red' }),
  margin: '10r',
})
