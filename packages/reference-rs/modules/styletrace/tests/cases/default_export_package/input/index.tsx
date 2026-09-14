/**
 * Test file.
 * This file provides coverage for the respective domain.
 * It inputs test cases and emits test results.
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