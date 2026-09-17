// Source file collection for native want extraction.
// It takes a project root plus config and emits relative paths with contents.
// Fragment files ride along: extraction only reads css calls, nothing else.

import { readFileSync } from 'node:fs'
import { relative } from 'node:path'
import fg from 'fast-glob'
import type { ReferenceUIConfig } from '../config/types.ts'
import type { NativeSourceFile } from './native.ts'

const COMPILE_EXCLUDE = ['**/node_modules/**', '**/*.d.ts', '**/.reference-ui/**']

function readFileOrSkip(file: string): string | null {
  try {
    return readFileSync(file, 'utf-8')
  } catch {
    return null
  }
}

export function collectCompileFiles(cwd: string, config: ReferenceUIConfig): NativeSourceFile[] {
  const files = fg.sync(config.include, {
    cwd,
    absolute: true,
    ignore: COMPILE_EXCLUDE,
  })

  const sources: NativeSourceFile[] = []
  for (const file of files) {
    const content = readFileOrSkip(file)
    if (content === null) continue
    sources.push({ path: relative(cwd, file), content })
  }
  return sources
}
