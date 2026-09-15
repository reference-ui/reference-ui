/**
 * Local app entry for the subpath_package station.
 * Imports PackageCard from the package subpath fixture-style-subpath/card and
 * re-exports it next to AppCard. Compile remaps input/packages to node_modules
 * so the exports map in the mock package.json is visible to the resolver.
 */
import { PackageCard, type PackageCardProps } from 'fixture-style-subpath/card'

export type AppCardProps = PackageCardProps

export function AppCard(props: AppCardProps) {
  return <PackageCard {...props} />
}

export { PackageCard } from 'fixture-style-subpath/card'
