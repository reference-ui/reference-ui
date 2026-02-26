/**
 * Runner - main interface for operating on a generated project.
 * Single API for all project operations (sync, build, dev, file ops).
 */

import { join } from 'node:path'
import { executeSync, executeBuild } from './commands.js'
import { startServer } from './dev-server.js'
import { allocatePort } from './port-manager.js'
import { readFile, updateFile } from './file-operations.js'
import { registerCleanup, runCleanup } from './cleanup.js'
import { getBundler } from '../project/bundlers/index.js'
import type { ProjectHandle } from '../project/types.js'
import type { CommandResult, DevServerHandle } from './types.js'

export class Runner {
  readonly #project: ProjectHandle
  readonly #bundlerName: string
  #devServer: DevServerHandle | null = null

  constructor(project: ProjectHandle, bundlerName: string) {
    this.#project = project
    this.#bundlerName = bundlerName
    registerCleanup('project', () => this.#project.cleanup())
  }

  get rootPath(): string {
    return this.#project.rootPath
  }

  /** Run ref sync */
  async runSync(): Promise<CommandResult> {
    return executeSync(this.#project.rootPath)
  }

  /** Run build */
  async runBuild(): Promise<CommandResult> {
    return executeBuild(this.#project.rootPath)
  }

  /** Start dev server, returns URL */
  async runDev(): Promise<string> {
    const port = await allocatePort()
    this.#devServer = await startServer(this.#project.rootPath, this.#bundlerName, port)
    registerCleanup('devServer', () => this.#devServer!.stop())
    return this.#devServer.url
  }

  /** Get dev server URL (after runDev) */
  getBrowserURL(): string | null {
    return this.#devServer?.url ?? null
  }

  /** Update a file (search/replace) */
  async updateFile(relativePath: string, search: string | RegExp, replace: string): Promise<void> {
    return updateFile(join(this.#project.rootPath, relativePath), search, replace)
  }

  /** Read file contents */
  async readFile(relativePath: string): Promise<string> {
    return readFile(join(this.#project.rootPath, relativePath))
  }

  /** Tear down all resources */
  async cleanup(): Promise<void> {
    if (this.#devServer) {
      await this.#devServer.stop()
      this.#devServer = null
    }
    await runCleanup()
  }
}
