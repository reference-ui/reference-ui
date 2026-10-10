/**
 * Today marker: useTodayMarker resolves the date the grid underlines —
 * the explicit `today` synchronously (SSR-deterministic), else the
 * client-local date after mount, else null pre-mount so SSR and first
 * hydration render no marker and hydrate warning-free. Local, not UTC.
 */
import * as React from 'react'
import { formatISODate } from '../dates/iso'
import type { ISODate } from '../types'

export function useTodayMarker(today: ISODate | undefined): ISODate | null {
  const [mountedToday, setMountedToday] = React.useState<ISODate | null>(null)
  React.useEffect(() => {
    if (today !== undefined) return
    const now = new Date()
    setMountedToday(formatISODate(now.getFullYear(), now.getMonth() + 1, now.getDate()))
  }, [today])
  return today ?? mountedToday
}
