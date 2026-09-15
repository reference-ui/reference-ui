/**
 * Local app entry for the default_export_package station.
 * Imports a default-export card from fixture-style-default, wraps it as AppCard,
 * and re-exports the default as PackageCard. The mock package lives under
 * input/packages so git can track it; compile remaps that folder to node_modules.
 */
import type { StyleProps } from '@reference-ui/react'
import DefaultCard from 'fixture-style-default'

export type AppCardProps = StyleProps & {
  title?: string
}

export function AppCard(props: AppCardProps) {
  return <DefaultCard {...props} />
}

export { default as PackageCard } from 'fixture-style-default'
