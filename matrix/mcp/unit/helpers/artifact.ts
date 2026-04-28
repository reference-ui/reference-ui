/**
 * MCP artifact cache bootstrap for the matrix fixture.
 *
 * The server can build lazily, but prebuilding the model keeps readiness focused
 * on HTTP startup and avoids repeating the expensive Atlas/Tasty work.
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

function resolveInstalledMcpChildPath(cwd: string): string {
  return join(cwd, 'node_modules', '@reference-ui', 'core', 'dist', 'cli', 'mcp-child.mjs')
}

function resolveMcpModelPath(cwd: string): string {
  return join(cwd, '.reference-ui', 'mcp', 'model.json')
}

export async function buildMcpArtifactCache(cwd: string): Promise<void> {
  if (existsSync(resolveMcpModelPath(cwd))) {
    return
  }

  const childScript = resolveInstalledMcpChildPath(cwd)

  if (!existsSync(childScript)) {
    throw new Error(`Expected installed MCP child script at ${childScript}`)
  }

  await new Promise<void>((resolve, reject) => {
    let stdout = ''
    let stderr = ''
    const child = spawn(process.execPath, [childScript, JSON.stringify({ kind: 'build', cwd })], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8')
    })

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8')
    })

    child.once('error', error => {
      reject(error)
    })

    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(
        new Error(
          [
            `mcp-child build failed (code=${code}, signal=${signal})`,
            '',
            'stdout:',
            stdout.trim() || '(empty)',
            '',
            'stderr:',
            stderr.trim() || '(empty)',
          ].join('\n'),
        ),
      )
    })
  })
}
