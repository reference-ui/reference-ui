import * as React from 'react'
import PrimaryButton from '../components/Button'

export function DefaultExportPage(): React.ReactElement {
  return (
    <div>
      <PrimaryButton variant="solid">Create</PrimaryButton>
      <PrimaryButton variant="ghost">Cancel</PrimaryButton>
    </div>
  )
}