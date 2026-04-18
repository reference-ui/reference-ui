import { Div, type StyleProps } from '@reference-ui/react'

type PanelProps = StyleProps & {
  title?: string
}

const SurfaceInner = ({ title, ...styleProps }: PanelProps) => {
  return <Div {...styleProps}>{title}</Div>
}

export { SurfaceInner as Panel }