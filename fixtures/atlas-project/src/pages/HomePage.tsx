import * as React from 'react'
import { Button } from '../components/Button'
import { AppCard } from '../components/AppCard'

// Button used 3×: variant solid×2, ghost×1
// AppCard used 2×
export function HomePage(): React.ReactElement {
  return (
    <div>
      <AppCard title="Welcome" padding="lg">
        <Button variant="solid" onClick={() => {}}>
          Get Started
        </Button>
        <Button variant="ghost">Learn More</Button>
      </AppCard>
      <AppCard title="Features" elevated padding="md">
        <Button variant="solid" size="sm" onClick={() => {}}>
          View All Features
        </Button>
      </AppCard>
    </div>
  )
}
