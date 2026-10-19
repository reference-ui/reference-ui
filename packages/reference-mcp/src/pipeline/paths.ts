// Generated-folder paths for the MCP model artifact.
// They take a project root and emit the mcp dir, model.json, and tasty manifest paths.
import { join } from 'node:path'
import { getOutDirPath } from '../core/paths'

export function getMcpDirPath(cwd: string): string {
  return join(getOutDirPath(cwd), 'mcp')
}

export function getMcpModelPath(cwd: string): string {
  return join(getMcpDirPath(cwd), 'model.json')
}

export function getMcpTypesManifestPath(cwd: string): string {
  return join(getOutDirPath(cwd), 'types', 'tasty', 'manifest.js')
}
