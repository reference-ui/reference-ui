import * as React from 'react'
import type { MissingProps } from '../types/missing'

export function BrokenCard(props: MissingProps): React.ReactElement {
  return <section>{JSON.stringify(props)}</section>
}
