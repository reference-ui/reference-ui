import {
  ReferenceRuntimeProvider,
  createDefaultReferenceRuntime,
  type ReferenceComponentProps,
} from '@reference-ui/types'
import { ReferenceView } from './ReferenceView'

const runtime = createDefaultReferenceRuntime()

export function Reference({ name }: ReferenceComponentProps) {
  return (
    <ReferenceRuntimeProvider runtime={runtime}>
      <ReferenceView name={name} />
    </ReferenceRuntimeProvider>
  )
}
