import { PackageCard, type PackageCardProps } from 'fixture-style-subpath/card'

export type AppCardProps = PackageCardProps

export function AppCard(props: AppCardProps) {
  return <PackageCard {...props} />
}

export { PackageCard } from 'fixture-style-subpath/card'