import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..', '..')
const refUiDir = join(pkgRoot, '.reference-ui')

export function virtualSystemPath(fileName: string): string {
  return join(refUiDir, 'virtual', 'src', 'system', fileName)
}

export function readVirtualSystemFile(fileName: string): string {
  return readFileSync(virtualSystemPath(fileName), 'utf-8')
}

export function hasVirtualSystemFile(fileName: string): boolean {
  return existsSync(virtualSystemPath(fileName))
}

export function readGeneratedFile(...segments: string[]): string | undefined {
  const path = join(refUiDir, ...segments)
  if (!existsSync(path)) return undefined
  return readFileSync(path, 'utf-8')
}
