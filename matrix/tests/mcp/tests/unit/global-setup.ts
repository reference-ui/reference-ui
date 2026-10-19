/**
 * Vitest global setup for the MCP matrix suite. Boots one shared matrix MCP
 * server before all test files and publishes its URL via
 * `MATRIX_MCP_SERVER_URL`, tearing it down afterwards. Every `*.test.ts`
 * here connects through it; none boots its own server.
 */

import { startMatrixMcpServer, stopMcpServer, type RunningMcpServer } from './helpers'

let running: RunningMcpServer | null = null

export default async function setup() {
  running = await startMatrixMcpServer()
  process.env.MATRIX_MCP_SERVER_URL = running.serverUrl.href

  return async () => {
    await stopMcpServer(running)
    running = null
    delete process.env.MATRIX_MCP_SERVER_URL
  }
}
