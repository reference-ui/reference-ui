import { Div, type StyleProps } from '@reference-ui/react'

export type SurfaceProps = StyleProps & {
  elevation?: number
}

export function Surface(props: SurfaceProps) {
  return <Div {...props} />
}