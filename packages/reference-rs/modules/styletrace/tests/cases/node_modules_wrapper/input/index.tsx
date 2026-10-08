/**
 * Local app entry for the node_modules_wrapper station.
 * Imports PackageCard from the mock fixture-style-lib package and re-exports it
 * alongside an AppCard wrapper that forwards the package props. Compile remaps
 * input/packages onto node_modules so the resolver sees a real package folder.
 */
import { PackageCard, type PackageCardProps } from 'fixture-style-lib'

export type AppCardProps = PackageCardProps

export function AppCard(props: AppCardProps) {
  return <PackageCard {...props} />
}

export { PackageCard } from 'fixture-style-lib'
