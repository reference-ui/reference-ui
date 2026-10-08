import * as React from 'react'
import { PrimaryButton as CTAButton } from '../components/public'

export function DefaultReexportAliasesPage(): React.ReactElement {
  return (
    <main>
      <CTAButton variant="solid">Create</CTAButton>
      <CTAButton variant="ghost">Cancel</CTAButton>
    </main>
  )
}
