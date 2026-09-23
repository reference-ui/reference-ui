// CLI printing helpers: they take exit-bound messages and emit the human
// [neo] lines. The usage block and the error-cause formatter live here so
// every command reports failures the same way; success lines stay with
// their commands. Output strings are pinned by the bin tests and the CLI
// cases — change them only with the pins.
export const USAGE = 'usage: neo <sync|clean> [dir]\n       neo sync --watch [dir]'

export function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export function printUsageError(detail: string): number {
  console.log(`${USAGE}\n${detail}`)
  return 1
}
