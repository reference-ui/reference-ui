/**
 * Dev server lifecycle management.
 * Start/stop dev server, wait for ready.
 */

import waitPort from 'wait-port'
import { spawnProcess, killTree } from './process-manager.js'
import { getBundler } from '../project/bundlers/index.js'
import type { DevServerHandle } from './types.js'

/** Start dev server. Returns handle with url and stop(). */
export async function startServer(
  projectRoot: string,
  bundlerName: string,
  port: number
): Promise<DevServerHandle> {
  const bundler = getBundler(bundlerName)
  const [cmd, ...args] = bundler.getDevServerCommand(projectRoot, port)
  const child = spawnProcess(cmd, args, { cwd: projectRoot })
  const url = `http://localhost:${port}`

  await waitPort({ host: 'localhost', port, timeout: 30_000 })

  return {
    url,
    stop: async () => {
      if (child.pid) {
        await killTree(child.pid)
      }
    },
  }
}
