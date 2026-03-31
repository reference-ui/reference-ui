import * as React from 'react'
import { AppButton } from '../components/AppButton'

export function PackageBarrelsPage(): React.ReactElement {
  return (
    <main>
      <AppButton variant="solid">Save</AppButton>
      <AppButton variant="ghost">Cancel</AppButton>
    </main>
  )
}
