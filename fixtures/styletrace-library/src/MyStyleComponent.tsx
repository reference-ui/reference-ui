import { Div, type StyleProps } from '@reference-ui/react'

export type MyStyleComponentProps = StyleProps & {
  title?: string
}

export function MyStyleComponent({ title, ...styleProps }: MyStyleComponentProps) {
  return <Div {...styleProps}>{title}</Div>
}