import { installPackagesTs } from './install/packages'
import type {
  RunPackagerTsPayload,
  TsPackagerCompletionEvent,
  TsPackageInput,
} from './types'

export function getTsPackagesForCompletionEvent(
  completionEvent: TsPackagerCompletionEvent
): TsPackageInput[] {
  if (completionEvent === 'packager-ts:runtime:complete') {
    return [
      {
        name: '@reference-ui/react',
        sourceEntry: 'src/entry/react.ts',
        outFile: 'react.mjs',
      },
      {
        name: '@reference-ui/system',
        sourceEntry: 'src/entry/system.ts',
        outFile: 'system.mjs',
      },
    ]
  }

  return [
    {
      name: '@reference-ui/types',
      sourceEntry: 'src/entry/types.ts',
      outFile: 'types.mjs',
    },
  ]
}

export async function executeDts(payload: RunPackagerTsPayload): Promise<void> {
  const packages = payload.packages ?? getTsPackagesForCompletionEvent(payload.completionEvent)
  await installPackagesTs(payload.cwd, packages)
}
