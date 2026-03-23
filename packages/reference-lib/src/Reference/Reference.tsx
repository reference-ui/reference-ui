import {
  ReferenceRuntimeProvider,
  createDefaultReferenceRuntime,
  type ReferenceProps,
} from '@reference-ui/types'
import { ReferenceView } from './ReferenceView'

const runtime = createDefaultReferenceRuntime()

export function Reference({ name }: ReferenceProps) {
  return (
    <ReferenceRuntimeProvider runtime={runtime}>
      <ReferenceView name={name} />
    </ReferenceRuntimeProvider>
  )
}
