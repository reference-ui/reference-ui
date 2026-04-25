import { spawnSync } from 'node:child_process'

interface ContainerRuntimeOptions {
  commandLabel?: string
  minimumDockerMemoryBytes?: number
}

interface ColimaStatus {
  display_name?: string
  memory?: number
}

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

function getDockerMemoryBytes(): number | null {
  const result = runCommand('docker', ['info', '--format', '{{json .MemTotal}}'])

  if (result.status !== 0) {
    return null
  }

  const value = Number.parseInt(result.stdout.trim(), 10)
  return Number.isFinite(value) ? value : null
}

function formatGiB(bytes: number): string {
  return `${(bytes / (1024 ** 3)).toFixed(1)} GiB`
}

function requiredColimaMemoryGiB(minimumDockerMemoryBytes: number): string {
  const gib = minimumDockerMemoryBytes / (1024 ** 3)
  return Number.isInteger(gib) ? String(gib) : gib.toFixed(1)
}

function getColimaStatus(): ColimaStatus | null {
  const result = runCommand('colima', ['status', '--json'])

  if (result.status !== 0) {
    return null
  }

  try {
    return JSON.parse(result.stdout) as ColimaStatus
  } catch {
    return null
  }
}

function stopColima(): void {
  const result = spawnSync('colima', ['stop'], {
    encoding: 'utf8',
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    throw new Error('Failed to stop Colima automatically before resizing. Run `colima stop` and retry.')
  }
}

function startColima(memoryGiB?: string): void {
  const args = ['start']

  if (memoryGiB) {
    args.push('--memory', memoryGiB)
  }

  const result = spawnSync('colima', args, {
    encoding: 'utf8',
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    const retryCommand = memoryGiB ? `colima start --memory ${memoryGiB}` : 'colima start'
    throw new Error(`Failed to start Colima automatically. Run \`${retryCommand}\` and retry.`)
  }
}

function ensureColimaMemory(options: ContainerRuntimeOptions, dockerMemoryBytes: number): void {
  if (!options.minimumDockerMemoryBytes) {
    return
  }

  if (dockerMemoryBytes >= options.minimumDockerMemoryBytes) {
    return
  }

  const commandLabel = options.commandLabel ?? 'this Dagger pipeline command'
  const currentMemory = formatGiB(dockerMemoryBytes)
  const requiredMemory = formatGiB(options.minimumDockerMemoryBytes)
  const targetMemoryGiB = requiredColimaMemoryGiB(options.minimumDockerMemoryBytes)

  console.log(
    `${commandLabel} requires at least ${requiredMemory} of Docker VM memory, but Colima currently exposes ${currentMemory}. Restarting Colima with --memory ${targetMemoryGiB}...`
  )

  stopColima()
  startColima(targetMemoryGiB)

  if (!dockerReachable()) {
    throw new Error('Colima restarted, but Docker is still unreachable. Check `docker version` and retry.')
  }

  const restartedMemoryBytes = getDockerMemoryBytes()
  if (restartedMemoryBytes !== null && restartedMemoryBytes >= options.minimumDockerMemoryBytes) {
    return
  }

  const detectedMemory = restartedMemoryBytes === null ? 'an unknown amount' : formatGiB(restartedMemoryBytes)
  throw new Error(
    `${commandLabel} requires at least ${requiredMemory} of Docker VM memory, but Colima still reports ${detectedMemory} after restart. Run \`colima stop && colima start --memory ${targetMemoryGiB}\` manually and retry.`
  )
}

function assertDockerMemory(options: ContainerRuntimeOptions): void {
  if (!options.minimumDockerMemoryBytes) {
    return
  }

  const dockerMemoryBytes = getDockerMemoryBytes()
  if (dockerMemoryBytes === null || dockerMemoryBytes >= options.minimumDockerMemoryBytes) {
    return
  }

  const commandLabel = options.commandLabel ?? 'this Dagger pipeline command'
  const currentMemory = formatGiB(dockerMemoryBytes)
  const requiredMemory = formatGiB(options.minimumDockerMemoryBytes)
  const dockerContext = getDockerContext()

  if (isMacOs() && dockerContext === 'colima' && commandAvailable('colima')) {
    const colimaStatus = getColimaStatus()
    const colimaMemoryBytes = colimaStatus?.memory

    if (typeof colimaMemoryBytes === 'number') {
      ensureColimaMemory(options, colimaMemoryBytes)
      return
    }

    ensureColimaMemory(options, dockerMemoryBytes)
    return
  }

  throw new Error(
    `${commandLabel} requires at least ${requiredMemory} of Docker memory, but Docker currently reports ${currentMemory}. Increase the Docker backend memory allocation and retry.`
  )
}

function colimaRunning(): boolean {
  const result = runCommand('colima', ['status'])
  return result.status === 0 && /^status:.*running/im.test(result.stdout)
}

export function ensureContainerRuntime(options: ContainerRuntimeOptions = {}): void {
  if (!isMacOs()) {
    return
  }

  if (!commandAvailable('docker')) {
    throw new Error('Docker CLI is required for the Dagger pipeline. Run `pnpm setup:local` first.')
  }

  if (dockerReachable()) {
    assertDockerMemory(options)
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
    assertDockerMemory(options)
    return
  }

  console.log('Docker context is `colima` but the VM is not running. Starting Colima...')
  startColima()

  if (!dockerReachable()) {
    throw new Error('Colima started, but Docker is still unreachable. Check `docker version` and retry.')
  }

  assertDockerMemory(options)
}