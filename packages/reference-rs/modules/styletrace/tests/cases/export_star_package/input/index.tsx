/**
 * Test file.
 * This file provides coverage for the respective domain.
 * It inputs test cases and emits test results.
 */

import { PackageCard, type PackageCardProps } from 'fixture-style-barrel'

export type AppCardProps = PackageCardProps

export function AppCard(props: AppCardProps) {
  return <PackageCard {...props} />
}

export { PackageCard } from 'fixture-style-barrel'