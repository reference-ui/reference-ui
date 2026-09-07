import * as React from 'react'
import './book.css'
import { BookShell } from './BookShell'
import { BookRenderer } from './BookRenderer'

export function BookRoot() {
  const isRenderer = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('renderer') === 'true' || params.get('isolated') === 'true'
  }, [])

  if (isRenderer) {
    return <BookRenderer />
  }

  return <BookShell />
}
