/**
 * Run commands against a generated project (sync, build, dev server).
 */

import { execa } from 'execa'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export interface RunResult {
  success: boolean
  stdout: string
  stderr: string
}

export class Runner {
  private devProcess: ReturnType<typeof spawn> | null = null
  private port: number | null = null

  constructor(public readonly root: string) {}

  static forProject(root: string): Runner {
    return new Runner(root)
  }

  async runSync(): Promise<RunResult> {
    const corePath = join(this.root, 'node_modules', '@reference-ui/core')
    const cliPath = join(corePath, 'dist/cli/index.mjs')
    if (!existsSync(cliPath)) {
      return { success: false, stdout: '', stderr: `CLI not built at ${cliPath}. Run pnpm build in reference-core first.` }
    }

    const result = await execa('node', [cliPath, 'sync'], {
      cwd: this.root,
      reject: false,
      all: true,
    })
    return {
      success: result.exitCode === 0,
      stdout: result.all ?? '',
      stderr: result.stderr ?? '',
    }
  }

  async runBuild(): Promise<RunResult> {
    const result = await execa('pnpm', ['run', 'build'], {
      cwd: this.root,
      reject: false,
      all: true,
    })
    return {
      success: result.exitCode === 0,
      stdout: result.all ?? '',
      stderr: result.stderr ?? '',
    }
  }

  async runDev(opts?: { timeout?: number }): Promise<string> {
    const { default: getPort } = await import('get-port')
    this.port = await getPort({ port: 5173 })
    const timeout = opts?.timeout ?? 30_000
    const url = `http://localhost:${this.port}`

    return new Promise((resolve, reject) => {
      let done = false
      this.devProcess = spawn('pnpm', ['run', 'dev', '--', '--port', String(this.port)], {
        cwd: this.root,
        stdio: 'pipe',
        env: { ...process.env, FORCE_COLOR: '0' },
      })

      const start = Date.now()
      const check = () => {
        if (done) return
        if (Date.now() - start > timeout) {
          done = true
          reject(new Error(`Dev server not ready at ${url} within ${timeout}ms`))
          return
        }
        fetch(url)
          .then(() => { if (!done) { done = true; resolve(url) } })
          .catch(() => setTimeout(check, 100))
      }
      setTimeout(check, 500)

      this.devProcess.on('error', (err) => { if (!done) { done = true; reject(err) } })
    })
  }

  async cleanup(): Promise<void> {
    if (this.devProcess?.pid) {
      this.devProcess.kill('SIGTERM')
      this.devProcess = null
    }
  }
}
