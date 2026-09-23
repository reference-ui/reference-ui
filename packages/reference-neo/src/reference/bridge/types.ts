// Reference tasty payload: it takes the project source dir plus the validated
// config and emits the shared input every bridge build function reads. Neo has
// no workers, so this is a phase payload, not a worker message; sync hands it
// to initReference and the tasty phase carries it from there.

import type { ReferenceUIConfig } from '../../config/types.ts'

export interface ReferenceTastyPayload {
  sourceDir: string
  config: ReferenceUIConfig
}
