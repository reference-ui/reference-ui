// Native compile call: the one atomic compile() invocation per sync. It takes
// the scoped request the recipe built and emits the engine's compiled bundle.
// The rs dist type entries cannot resolve under NodeNext, so the call
// describes the module boundary structurally and imports the runtime
// dynamically.

import type { NativeCompileRequest } from '@reference-ui/rust/contracts'
import type { NativeCompileResult } from './contract.ts'

interface AtomicModule {
  compile(request: NativeCompileRequest): Promise<NativeCompileResult>
}

export async function compileNative(request: NativeCompileRequest): Promise<NativeCompileResult> {
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicModule
  return atomic.compile(request)
}
