import * as React from 'react'
import { FancyButton as CTAButton } from '../components/FancyButton'
import SearchBox from '../components/SearchInput'

export function WrappedComponentsPage(): React.ReactElement {
  return (
    <main>
      <CTAButton variant="solid">Save</CTAButton>
      <CTAButton variant="ghost" disabled>
        Cancel
      </CTAButton>

      <SearchBox size="sm">People</SearchBox>
      <SearchBox size="md">Teams</SearchBox>
    </main>
  )
}
