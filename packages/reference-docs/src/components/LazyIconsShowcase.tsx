import * as React from 'react'
import { Div } from '@reference-ui/react'

const IconsShowcase = React.lazy(async () => {
  const mod = await import('./IconsShowcase')
  return { default: mod.IconsShowcase }
})

export function LazyIconsShowcase() {
  return (
    <React.Suspense
      fallback={
        <Div color="docsMuted" fontSize="md">
          Loading icon gallery…
        </Div>
      }
    >
      <IconsShowcase />
    </React.Suspense>
  )
}