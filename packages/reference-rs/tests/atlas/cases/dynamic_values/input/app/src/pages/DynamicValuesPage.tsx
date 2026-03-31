import * as React from 'react'
import { Button } from '../components/Button'

type DynamicValuesPageProps = {
  isPrimary: boolean
  isDisabled: boolean
}

export function DynamicValuesPage({
  isPrimary,
  isDisabled,
}: DynamicValuesPageProps): React.ReactElement {
  const variant = isPrimary ? 'ghost' : 'outline'

  return (
    <main>
      <Button variant="solid">Static</Button>
      <Button variant={variant}>Dynamic Variable</Button>
      <Button variant={isPrimary ? 'ghost' : 'outline'} disabled={isDisabled}>
        Dynamic Expression
      </Button>
    </main>
  )
}
