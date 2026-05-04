import { spawnSync } from 'node:child_process'

interface ContainerRuntimeOptions {
  commandLabel?: string
  minimumDockerCpuCount?: number
  minimumDockerMemoryBytes?: number
}

interface ColimaStatus {
  display_name?: string
  cpu?: number
  memory?: number
}

export interface DockerRuntimeInfo {
  context: string | null
  cpuCount: number | null
  memoryBytes: number | null
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

function getDockerCpuCount(): number | null {
  const result = runCommand('docker', ['info', '--format', '{{json .NCPU}}'])

  if (result.status !== 0) {
    return null
  }

  const value = Number.parseInt(result.stdout.trim(), 10)
  return Number.isFinite(value) ? value : null
}

export function getDockerRuntimeInfo(): DockerRuntimeInfo {
  return {
    context: getDockerContext(),
    cpuCount: getDockerCpuCount(),
    memoryBytes: getDockerMemoryBytes(),
  }
}

function formatGiB(bytes: number): string {
  return `${(bytes / (1024 ** 3)).toFixed(1)} GiB`
}

function formatCpuCount(cpuCount: number): string {
  return `${cpuCount} CPU${cpuCount === 1 ? '' : 's'}`
}

function formatRequiredDockerResources(options: ContainerRuntimeOptions): string {
  const parts: string[] = []

  if (options.minimumDockerCpuCount) {
    parts.push(formatCpuCount(options.minimumDockerCpuCount))
  }

  if (options.minimumDockerMemoryBytes) {
    parts.push(formatGiB(options.minimumDockerMemoryBytes))
  }

  return parts.join(' and ')
}

function formatDetectedDockerResources(runtime: DockerRuntimeInfo): string {
  const parts: string[] = []

  if (runtime.cpuCount !== null) {
    parts.push(formatCpuCount(runtime.cpuCount))
  }

  if (runtime.memoryBytes !== null) {
    parts.push(formatGiB(runtime.memoryBytes))
  }

  return parts.length === 0 ? 'unknown resources' : parts.join(' and ')
}

function needsMoreDockerCpu(options: ContainerRuntimeOptions, cpuCount: number | null): boolean {
  return Boolean(options.minimumDockerCpuCount && cpuCount !== null && cpuCount < options.minimumDockerCpuCount)
}

function needsMoreDockerMemory(options: ContainerRuntimeOptions, memoryBytes: number | null): boolean {
  return Boolean(
    options.minimumDockerMemoryBytes &&
    memoryBytes !== null &&
    memoryBytes < options.minimumDockerMemoryBytes
  )
}

function needsMoreDockerResources(options: ContainerRuntimeOptions, runtime: DockerRuntimeInfo): boolean {
  return needsMoreDockerCpu(options, runtime.cpuCount) || needsMoreDockerMemory(options, runtime.memoryBytes)
}

function requiredColimaMemoryGiB(minimumDockerMemoryBytes: number): string {
  const gib = minimumDockerMemoryBytes / (1024 ** 3)
  return Number.isInteger(gib) ? String(gib) : gib.toFixed(1)
}

function getDesiredColimaStartOptions(options: ContainerRuntimeOptions): {
  cpuCount?: number
  memoryGiB?: string
} {
  return {
    cpuCount: options.minimumDockerCpuCount,
    memoryGiB: options.minimumDockerMemoryBytes
      ? requiredColimaMemoryGiB(options.minimumDockerMemoryBytes)
      : undefined,
  }
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

function colimaStatusSatisfiesRequirements(
  options: ContainerRuntimeOptions,
  colimaStatus: ColimaStatus | null,
): boolean {
  if (!colimaStatus) {
    return false
  }

  const cpuSatisfied =
    !options.minimumDockerCpuCount ||
    (typeof colimaStatus.cpu === 'number' && colimaStatus.cpu >= options.minimumDockerCpuCount)

  const memorySatisfied =
    !options.minimumDockerMemoryBytes ||
    (typeof colimaStatus.memory === 'number' && colimaStatus.memory >= options.minimumDockerMemoryBytes)

  return cpuSatisfied && memorySatisfied
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

function startColima(options: { cpuCount?: number; memoryGiB?: string } = {}): void {
  const args = ['start']

  if (options.cpuCount) {
    args.push('--cpu', String(options.cpuCount))
  }

  if (options.memoryGiB) {
    args.push('--memory', options.memoryGiB)
  }

  const result = spawnSync('colima', args, {
    encoding: 'utf8',
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    const retryArgs = args.slice(1).join(' ')
    const retryCommand = retryArgs.length > 0 ? `colima start ${retryArgs}` : 'colima start'
    throw new Error(`Failed to start Colima automatically. Run \`${retryCommand}\` and retry.`)
  }
}

function ensureColimaResources(options: ContainerRuntimeOptions, runtime: DockerRuntimeInfo): void {
  if (!needsMoreDockerResources(options, runtime)) {
    return
  }

  const commandLabel = options.commandLabel ?? 'this Dagger pipeline command'
  const requiredResources = formatRequiredDockerResources(options)
  const detectedResources = formatDetectedDockerResources(runtime)
  const desiredColimaStartOptions = getDesiredColimaStartOptions(options)
  const desiredArgs = [
    desiredColimaStartOptions.cpuCount ? `--cpu ${desiredColimaStartOptions.cpuCount}` : null,
    desiredColimaStartOptions.memoryGiB ? `--memory ${desiredColimaStartOptions.memoryGiB}` : null,
  ].filter((value): value is string => value !== null)
  const desiredArgText = desiredArgs.join(' ')

  console.log(
    `${commandLabel} requires at least ${requiredResources}, but Colima currently exposes ${detectedResources}. Restarting Colima with ${desiredArgText}...`
  )

  stopColima()
  startColima(desiredColimaStartOptions)

  if (!dockerReachable()) {
    throw new Error('Colima restarted, but Docker is still unreachable. Check `docker version` and retry.')
  }

  const restartedColimaStatus = getColimaStatus()
  if (colimaStatusSatisfiesRequirements(options, restartedColimaStatus)) {
    return
  }

  const restartedRuntime = getDockerRuntimeInfo()
  if (!needsMoreDockerResources(options, restartedRuntime)) {
    return
  }

  const manualCommand = `colima stop && colima start ${desiredArgText}`
  throw new Error(
    `${commandLabel} requires at least ${requiredResources}, but Colima still reports ${formatDetectedDockerResources(restartedRuntime)} after restart. Run \`${manualCommand}\` manually and retry.`
  )
}

function assertDockerResources(options: ContainerRuntimeOptions): void {
  if (!options.minimumDockerCpuCount && !options.minimumDockerMemoryBytes) {
    return
  }

  const runtime = getDockerRuntimeInfo()
  if (!needsMoreDockerResources(options, runtime)) {
    return
  }

  const commandLabel = options.commandLabel ?? 'this Dagger pipeline command'
  const requiredResources = formatRequiredDockerResources(options)
  const dockerContext = runtime.context

  if (isMacOs() && dockerContext === 'colima' && commandAvailable('colima')) {
    const colimaStatus = getColimaStatus()
    ensureColimaResources(options, {
      context: dockerContext,
      cpuCount: colimaStatus?.cpu ?? runtime.cpuCount,
      memoryBytes: colimaStatus?.memory ?? runtime.memoryBytes,
    })
    return
  }

  throw new Error(
    `${commandLabel} requires at least ${requiredResources}, but Docker currently reports ${formatDetectedDockerResources(runtime)}. Increase the Docker backend CPU or memory allocation and retry.`
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
    assertDockerResources(options)
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
    assertDockerResources(options)
    return
  }

  console.log('Docker context is `colima` but the VM is not running. Starting Colima...')
  startColima(getDesiredColimaStartOptions(options))

  if (!dockerReachable()) {
    throw new Error('Colima started, but Docker is still unreachable. Check `docker version` and retry.')
  }

  assertDockerResources(options)
}