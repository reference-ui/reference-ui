import { css } from '@reference-ui/react'

const panel = css({ padding: '2r' })
const { Div } = { Div: 'div' } as const

export function DefinedByDestructuring() {
  return <Div>{panel}</Div>
}
