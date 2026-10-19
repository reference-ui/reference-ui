// model.json artifact persistence.
// It takes a project root plus the built artifact and emits the written file path; the read
// entry parses it back. The directory is created on write.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import type { McpBuildArtifact } from './types'
import { getMcpDirPath, getMcpModelPath } from './paths'

export async function writeMcpArtifact(
  cwd: string,
  artifact: McpBuildArtifact
): Promise<string> {
  const dirPath = getMcpDirPath(cwd)
  const filePath = getMcpModelPath(cwd)

  await mkdir(dirPath, { recursive: true })
  await writeFile(filePath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8')

  return filePath
}

export async function readMcpArtifact(cwd: string): Promise<McpBuildArtifact> {
  const filePath = getMcpModelPath(cwd)
  const raw = await readFile(filePath, 'utf8')
  return JSON.parse(raw) as McpBuildArtifact
}
