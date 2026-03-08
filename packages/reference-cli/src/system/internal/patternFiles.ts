import { join } from 'node:path'

export function resolveInternalPatternFiles(rootDir: string): string[] {
  return [
    join(rootDir, 'src/system/internal/container/container.ts'),
    join(rootDir, 'src/system/internal/r/r.ts'),
  ]
}
