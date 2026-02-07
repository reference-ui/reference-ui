import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import type { BuildResult } from '../compiler/index.js'

const SYSTEM_DIR = '.reference/system'

/** Write BuildResult.files to packageRoot/.reference/system/ */
export function materializeBuildResult(packageRoot: string, result: BuildResult): void {
  const systemDir = resolve(packageRoot, SYSTEM_DIR)

  for (const [relativePath, content] of result.files) {
    const absolutePath = resolve(systemDir, relativePath)
    mkdirSync(dirname(absolutePath), { recursive: true })

    if (typeof content === 'string') {
      writeFileSync(absolutePath, content, 'utf-8')
    } else {
      writeFileSync(absolutePath, Buffer.from(content))
    }
  }
}
