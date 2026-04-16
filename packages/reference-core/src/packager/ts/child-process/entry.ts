import { executePackagerTsDts } from '../execute-dts'
import type { TsPackagerCompletionEvent, TsPackagerDtsPayload } from '../types'

interface PackagerTsChildPayload {
  completionEvent: TsPackagerCompletionEvent
  cwd: string
  packages: TsPackagerDtsPayload['packages']
}

async function main(): Promise<void> {
  const raw = process.argv[2]
  if (raw == null || raw === '') {
    console.error('packager-ts-child: missing JSON payload (argv[2])')
    process.exit(1)
  }

  let body: PackagerTsChildPayload
  try {
    body = JSON.parse(raw) as PackagerTsChildPayload
  } catch {
    console.error('packager-ts-child: invalid JSON payload')
    process.exit(1)
  }

  try {
    await executePackagerTsDts(
      { cwd: body.cwd, packages: body.packages },
      body.completionEvent
    )
    process.exit(0)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(msg)
    process.exit(1)
  }
}

main()
