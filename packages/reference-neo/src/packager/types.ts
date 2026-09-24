// Input shapes for the Neo packager assembly.
// It takes nothing at runtime and emits the publish input sync fills from compile output plus the assembly input the packager runs on.
// The assembly input is the packager's entire contract with sync: everything packaging needs, nothing it doesn't.

import type { EvaluatedSystemSpec, NativeRuntimeArtifact } from '@reference-ui/rust/contracts'
import type { JsxElementsArtifact } from '../system/base/jsx.ts'
import type { SystemStreams } from '../system/base/types.ts'

export interface PublishInput {
  outDir: string
  spec: EvaluatedSystemSpec
  portableFragment: string
  stylesheet: string
  portableStylesheet: string
  /** Published structured stylesheet: the upstream expansion plus the own entry, always. */
  streams: SystemStreams[]
  jsx: JsxElementsArtifact
}

/** Full assembly input: the publish input plus the compiled runtime artifact the bundle legs bind. */
export interface AssemblyInput extends PublishInput {
  runtime: NativeRuntimeArtifact
}
