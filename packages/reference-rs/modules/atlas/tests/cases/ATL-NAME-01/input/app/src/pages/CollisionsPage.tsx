import * as React from 'react'
import { Button as HeroButton } from '../components/marketing/Button'
import { Button as SubmitButton } from '../components/forms/Button'

export function CollisionsPage(): React.ReactElement {
  return (
    <main>
      <HeroButton tone="hero">Launch</HeroButton>
      <SubmitButton variant="submit">Save</SubmitButton>
      <SubmitButton variant="reset" disabled>
        Reset
      </SubmitButton>
    </main>
  )
}
