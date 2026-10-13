import { Div, type StyleProps } from '@reference-ui/react'

export function Ping(props: StyleProps) {
  return (
    <>
      <Pong {...props} />
      <Div {...props} />
    </>
  )
}

export function Pong(props: StyleProps) {
  return <Ping {...props} />
}

export function Solo1(props: StyleProps) {
  return <Solo2 {...props} />
}

export function Solo2(props: StyleProps) {
  return <Solo1 {...props} />
}
