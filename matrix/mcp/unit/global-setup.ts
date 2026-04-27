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
