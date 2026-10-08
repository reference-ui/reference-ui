/**
 * Local app entry for the export_star_package station.
 * Imports PackageCard from a mock package whose root is an export-star barrel.
 * AppCard wraps that export and the barrel name is re-exported as PackageCard.
 * Compile remaps input/packages onto node_modules.
 */
import { PackageCard, type PackageCardProps } from 'fixture-style-barrel'

export type AppCardProps = PackageCardProps

export function AppCard(props: AppCardProps) {
  return <PackageCard {...props} />
}

export { PackageCard } from 'fixture-style-barrel'
