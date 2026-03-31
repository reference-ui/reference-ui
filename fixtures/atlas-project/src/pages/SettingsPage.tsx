import * as React from 'react'
import { Button } from '../components/Button'
import { AppCard } from '../components/AppCard'

// Button used 2×: variant outline×2
// AppCard used 1×
export function SettingsPage(): React.ReactElement {
  return (
    <div>
      <AppCard title="Preferences" padding="md" status="default" statusLabel="Saved">
        <Button variant="outline" onClick={() => {}}>
          Save Changes
        </Button>
        <Button variant="outline" disabled>
          Reset
        </Button>
      </AppCard>
    </div>
  )
}
