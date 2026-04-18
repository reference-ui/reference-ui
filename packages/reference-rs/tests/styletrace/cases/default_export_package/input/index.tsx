import type { StyleProps } from '@reference-ui/react'
import DefaultCard from 'fixture-style-default'

export type AppCardProps = StyleProps & {
  title?: string
}

export function AppCard(props: AppCardProps) {
  return <DefaultCard {...props} />
}

export { default as PackageCard } from 'fixture-style-default'