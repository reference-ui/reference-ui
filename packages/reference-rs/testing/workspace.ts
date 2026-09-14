/**
 * Virtual workspace generator for process-isolated filesystem testing.
 * Creates ephemeral scratch trees under target/scratch-tests for compiler runs,
 * mock packages, and subpath resolution scenarios. Supports Symbol.asyncDispose
 * to guarantee zero-leak cleanup without polluting git working trees.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

export interface VirtualWorkspace {
  /** Absolute path to the workspace root directory */
  readonly rootDir: string
  /** Unique workspace run identifier */
  readonly id: string
  /** Writes a file relative to rootDir */
  writeFile(relativePath: string, content: string): void
  /** Reads a file relative to rootDir */
  readFile(relativePath: string): string
  /** Checks whether a file exists relative to rootDir */
  exists(relativePath: string): boolean
  /** Resolves absolute path inside the workspace */
  resolve(...segments: string[]): string
  /** Cleans up workspace directory */
  cleanup(): Promise<void>
  /** Disposable support */
  [Symbol.asyncDispose](): Promise<void>
}

/**
 * Creates a process-safe scratch workspace pre-populated with declared files.
 */
export async function createVirtualWorkspace(
  files: Record<string, string> = {},
  suiteName = 'test'
): Promise<VirtualWorkspace> {
  const id = `${suiteName}-${crypto.randomBytes(6).toString('hex')}`
  const baseDir = path.resolve(process.cwd(), 'target', 'scratch-tests')
  const rootDir = path.join(baseDir, id)

  fs.mkdirSync(rootDir, { recursive: true })

  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(rootDir, relPath)
    fs.mkdirSync(path.dirname(fullPath), { recursive: true })
    fs.writeFileSync(fullPath, content, 'utf-8')
  }

  const workspace: VirtualWorkspace = {
    rootDir,
    id,
    writeFile(relPath: string, content: string): void {
      const fullPath = path.join(rootDir, relPath)
      fs.mkdirSync(path.dirname(fullPath), { recursive: true })
      fs.writeFileSync(fullPath, content, 'utf-8')
    },
    readFile(relPath: string): string {
      return fs.readFileSync(path.join(rootDir, relPath), 'utf-8')
    },
    exists(relPath: string): boolean {
      return fs.existsSync(path.join(rootDir, relPath))
    },
    resolve(...segments: string[]): string {
      return path.resolve(rootDir, ...segments)
    },
    async cleanup(): Promise<void> {
      try {
        if (fs.existsSync(rootDir)) {
          fs.rmSync(rootDir, { recursive: true, force: true })
        }
      } catch {
        // Ignore transient cleanup errors
      }
    },
    async [Symbol.asyncDispose](): Promise<void> {
      await this.cleanup()
    },
  }

  return workspace
}
