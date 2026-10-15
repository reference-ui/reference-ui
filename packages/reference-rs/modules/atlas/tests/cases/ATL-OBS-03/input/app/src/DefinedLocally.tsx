import { css } from '@reference-ui/react'

const panel = css({ padding: '2r' })

function Div({ children }: { children?: unknown }) {
  return <article>{children as never}</article>
}

export function DefinedLocally() {
  return <Div>{panel}</Div>
}
