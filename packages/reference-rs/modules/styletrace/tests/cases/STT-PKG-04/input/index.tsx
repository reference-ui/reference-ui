import { PackageCard, type PackageCardProps } from 'fixture-exports-entry'

export type AppCardProps = PackageCardProps

export function AppCard(props: AppCardProps) {
  return <PackageCard {...props} />
}

export { PackageCard } from 'fixture-exports-entry'
