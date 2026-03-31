import * as React from 'react'
import { AppButton } from '../components/AppButton'
import PackageButton from '@fixtures/default-barrel-ui'

export function PackageDefaultBarrelsPage(): React.ReactElement {
  return (
    <main>
      <AppButton variant="solid">Local Wrapper</AppButton>
      <PackageButton variant="ghost">Package Default</PackageButton>
      <PackageButton variant="solid">Package Default Two</PackageButton>
    </main>
  )
}