import { css } from '@reference-ui/react'

export function paint(props: { color: 'red'; size: 4 }) {
  return css({ color: props.color, fontSize: props.size })
}

export function destructure({ color }: { color: 'red' }) {
  return css({ color })
}

export function rename({ primary: color }: { primary: 'blue' }) {
  return css({ color })
}

export function untyped(props) {
  return css({ color: props.color, margin: '1r' })
}

export function optional(props: { color?: 'red' }) {
  return css({ color: props.color, margin: '2r' })
}

export function partial({ color, children }: { color: 'red'; children: unknown }) {
  return css({ color, margin: '3r' })
}

export function nonliteral(props: { color: string }) {
  return css({ color: props.color, margin: '4r' })
}

export function nested(props: { theme: { color: 'red' } }) {
  return css({ color: props.theme, margin: '5r' })
}

export function rest({ ...all }: { color: 'red' }) {
  return css({ color: all.color, margin: '6r' })
}

export function defaults({ color = 'blue' }: { color: 'red' }) {
  return css({ color, margin: '7r' })
}

export function restListed({ color, ...rest }: { color: 'red'; size: 4 }) {
  return css({ color, fontSize: rest.size, margin: '8r' })
}

export function defaultMissing({ size = '4px' }: { color: 'red' }) {
  return css({ padding: size, margin: '9r' })
}

const fallbackSize = '8px'

export function defaultIdent({ size = fallbackSize }: { color: 'red' }) {
  return css({ padding: size, margin: '10r' })
}

export function partialLeniency({ color, missing }: { color: 'red' }) {
  return css({ color, backgroundColor: missing, margin: '11r' })
}
