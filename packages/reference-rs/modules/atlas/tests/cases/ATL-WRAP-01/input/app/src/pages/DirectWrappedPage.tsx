import * as React from 'react'
import DirectMemo from '../components/DirectMemo'
import DirectRefBox from '../components/DirectForwardRef'

export function DirectWrappedPage(): React.ReactElement {
  return (
    <main>
      <DirectMemo tone="loud">Ship</DirectMemo>
      <DirectMemo tone="quiet">Hold</DirectMemo>

      <DirectRefBox size="sm">People</DirectRefBox>
      <DirectRefBox size="md">Teams</DirectRefBox>
    </main>
  )
}
