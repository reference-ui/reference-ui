import { PackageCard, type PackageCardProps } from 'fixture-style-barrel'

export type AppCardProps = PackageCardProps

export function AppCard(props: AppCardProps) {
  return <PackageCard {...props} />
}

export { PackageCard } from 'fixture-style-barrel'