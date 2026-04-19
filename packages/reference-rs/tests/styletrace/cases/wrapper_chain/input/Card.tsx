import type { StyleProps } from '@reference-ui/react'

import { Surface } from './Surface'

export type CardProps = StyleProps & {
  title: string
}

export function Card({ title, ...styleProps }: CardProps) {
  return <Surface data-title={title} {...styleProps} />
}