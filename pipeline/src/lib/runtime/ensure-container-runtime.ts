import { spawnSync } from 'node:child_process'

function isMacOs(): boolean {
  return process.platform === 'darwin'
}

function runCommand(command: string, args: string[]) {
  return spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function commandAvailable(command: string): boolean {
  const result = runCommand('sh', ['-lc', `command -v ${command}`])
  return result.status === 0
}

function getDockerContext(): string | null {
  const result = runCommand('docker', ['context', 'show'])
  if (result.status !== 0) {
    return null
  }

  return result.stdout.trim() || null
}

function dockerReachable(): boolean {
  return runCommand('docker', ['version']).status === 0
}

function colimaRunning(): boolean {
  const result = runCommand('colima', ['status'])
  return result.status === 0 && /^status:.*running/im.test(result.stdout)
}

function startColima(): void {
  const result = spawnSync('colima', ['start'], {
    encoding: 'utf8',
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    throw new Error('Failed to start colima automatically. Run `colima start` and retry.')
  }
}

export function ensureContainerRuntime(): void {
  if (!isMacOs()) {
    return
  }

  if (!commandAvailable('docker')) {
    throw new Error('Docker CLI is required for the Dagger pipeline. Run `pnpm setup:local` first.')
  }

  if (dockerReachable()) {
    return
  }

  const dockerContext = getDockerContext()
  if (dockerContext !== 'colima') {
    throw new Error(
      'Docker is not reachable for the Dagger pipeline. Start your Docker backend or switch to the `colima` Docker context.'
    )
  }

  if (!commandAvailable('colima')) {
    throw new Error('Colima is required for the active Docker context. Run `pnpm setup:local` first.')
  }

  if (colimaRunning()) {
    if (!dockerReachable()) {
      throw new Error('Colima reports running, but Docker is still unreachable. Check `docker version` and your Docker context.')
    }
    return
  }

  console.log('Docker context is `colima` but the VM is not running. Starting Colima...')
  startColima()

  if (!dockerReachable()) {
    throw new Error('Colima started, but Docker is still unreachable. Check `docker version` and retry.')
  }
}