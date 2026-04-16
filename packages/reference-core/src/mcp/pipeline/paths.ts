import { join } from 'node:path'
import { getOutDirPath } from '../../lib/paths'

export function getMcpDirPath(cwd: string): string {
  return join(getOutDirPath(cwd), 'mcp')
}

export function getMcpModelPath(cwd: string): string {
  return join(getMcpDirPath(cwd), 'model.json')
}

export function getMcpTypesManifestPath(cwd: string): string {
  return join(getOutDirPath(cwd), 'types', 'tasty', 'manifest.js')
}
